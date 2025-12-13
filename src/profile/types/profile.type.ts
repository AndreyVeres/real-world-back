import { UserEntity } from '@app/user/user.entity';

export type Profile = Omit<UserEntity, 'hashPassword'> & { following: boolean , followersCount?:number };
