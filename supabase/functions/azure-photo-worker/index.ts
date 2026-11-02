import {createAzurePhotoHandler} from '../_shared/production-photo-handler.mjs';
import {runPhotoReview} from '../_shared/photo-review-workflow.ts';
import {analyzeAzureReview} from '../_shared/azure-review.ts';
import {REVIEWED_PHOTO_FILES} from './reviewed-runner.mjs';
Deno.serve(createAzurePhotoHandler({reviewedFiles:REVIEWED_PHOTO_FILES,getEnv:(key:string)=>Deno.env.get(key),analyze:analyzeAzureReview,review:runPhotoReview}));
