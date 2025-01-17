import { AuthTypes } from './auth'
import { StreamTypes } from './stream'
import { ChatTypes } from './chat'
import { NotificationTypes } from './notifications'
import { SocialTypes } from './social'

export interface Database {
  public: AuthTypes & StreamTypes & ChatTypes & NotificationTypes & SocialTypes
}