import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { assertOwnUser, authenticatedUser, errorResponse, HttpError, jsonResponse, requestBody, requestMethod } from '../_shared/request.ts'
import { approvedPrice, billingCommand, checkoutAllowed, schedulePeriodCancellation, stripeId, subscriptionConfig } from '../_shared/subscription.ts'

serve(async req => {
 const method=requestMethod(req);if(method)return method
 try {
  const user=await authenticatedUser(req)
  if(user.is_anonymous)throw new HttpError(403,'Verified account required')
  const body=await requestBody(req);assertOwnUser(body.userId,user.id)
  if(!['cancel','resume','change_plan'].includes(String(body.action)))throw new HttpError(400,'Invalid membership action')
  if(body.action==='change_plan'&&body.plan!=='premium'&&body.plan!=='maxed')throw new HttpError(400,'Select Premium or Maxed')
  if(body.action!=='change_plan'&&body.plan!==undefined)throw new HttpError(400,'Unexpected plan')
  if(typeof body.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId))throw new HttpError(400,'Valid request identity required')
  const config=subscriptionConfig();checkoutAllowed(user.id)
  const identity={user_id:user.id,request_id:body.requestId}
  const operation=await billingCommand('management_reserve',{...identity,action:body.action,plan:body.plan??null})
  if(operation?.state==='complete'&&operation.result)return jsonResponse(operation.result)
  if(operation?.state!=='pending')throw new HttpError(503,'Management reservation unavailable')
  const account=await billingCommand('account',{user_id:user.id})
  if(!account?.subscription_id||account.subscription_id!==operation.subscription_id||(account.risk_hold&&body.action!=='cancel'))throw new HttpError(409,'Membership requires review')
  const stripe=new Stripe(config.key,{apiVersion:'2023-10-16'})
  const sub=await stripe.subscriptions.retrieve(account.subscription_id)
  if(sub.livemode||stripeId(sub.customer)!==account.customer_id||sub.metadata.clipt_user_id!==user.id
   ||!['active','past_due'].includes(sub.status)||sub.items.has_more||sub.items.data.length!==1
   ||sub.items.data[0].quantity!==1)throw new HttpError(409,'Subscription binding or state could not be verified')
  const idempotencyKey='clipt-sandbox-manage:'+user.id+':'+body.requestId
  if(body.action==='cancel'||body.action==='resume') {
   const updated=await schedulePeriodCancellation(stripe,sub,user.id,account.customer_id,body.requestId,body.action==='cancel')
   const finished=await billingCommand('management_complete',{...identity,result:{testMode:true,fulfillmentStatus:'awaiting_webhook',cancelAtPeriodEnd:updated.cancel_at_period_end}})
   return jsonResponse(finished.result)
  }
  if(body.plan!=='premium'&&body.plan!=='maxed')throw new HttpError(400,'Select Premium or Maxed')
  if(sub.status!=='active'||sub.cancel_at_period_end||sub.pending_update)throw new HttpError(409,'Resolve the pending billing state before changing plans')
  const currentPrice=sub.items.data[0].price.id
  if(!Object.values(config.prices).includes(currentPrice))throw new HttpError(409,'Current price requires review')
  await approvedPrice(stripe,body.plan,config.prices)
  if(currentPrice===config.prices[body.plan])throw new HttpError(409,'Already on the selected provider plan')
  // Both directions take effect at renewal, avoiding mid-period prorations or
  // free upgrades. Only the subsequently paid invoice grants the new tier.
  const schedule=sub.schedule?await stripe.subscriptionSchedules.retrieve(stripeId(sub.schedule)!):
   await stripe.subscriptionSchedules.create({from_subscription:sub.id},{idempotencyKey:idempotencyKey+':schedule'})
  if(schedule.livemode||stripeId(schedule.subscription)!==sub.id||stripeId(schedule.customer)!==account.customer_id||schedule.status!=='active')throw new HttpError(409,'Schedule binding could not be verified')
  const phase=schedule.current_phase
  if(!phase||phase.end_date!==sub.current_period_end)throw new HttpError(409,'Billing period changed; refresh before retrying')
  const captured=await billingCommand('management_snapshot',{...identity,parameters:{schedule_id:schedule.id,start:phase.start_date,end:phase.end_date,current_price:currentPrice,target_price:config.prices[body.plan]}})
  const parameters=captured?.provider_parameters
  if(!parameters||parameters.schedule_id!==schedule.id||parameters.end!==phase.end_date
   ||parameters.current_price!==currentPrice||parameters.target_price!==config.prices[body.plan])throw new HttpError(409,'Original plan change needs review; do not start another request')
  await stripe.subscriptionSchedules.update(schedule.id,{
   end_behavior:'release',proration_behavior:'none',
   phases:[
    {start_date:parameters.start,end_date:parameters.end,items:[{price:parameters.current_price,quantity:1}],proration_behavior:'none'},
    {items:[{price:parameters.target_price,quantity:1}],iterations:1,proration_behavior:'none'},
   ],
  },{idempotencyKey})
  const finished=await billingCommand('management_complete',{...identity,result:{testMode:true,fulfillmentStatus:'awaiting_paid_renewal',effectiveAt:new Date(parameters.end*1000).toISOString(),plan:body.plan}})
  return jsonResponse(finished.result)
 }catch(error){return errorResponse(error)}
})
