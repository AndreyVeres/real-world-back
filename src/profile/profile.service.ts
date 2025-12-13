import { UserEntity } from '@app/user/user.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './types/profile.type';
import { ProfileResponse } from './types/profileResponse.interface';
import { FollowEntity } from './follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity) private readonly followsRepository: Repository<FollowEntity>,
  ) {}

  public async follow(profileName: string, userId: number): Promise<Profile> {
    const profile = await this.userRepository.findOne({ where: { username: profileName } });

    if (!profile) throw new NotFoundException('Profile not found');
    if (userId === profile.id) throw new BadRequestException('Cant follow yourself');

    const follower = await this.userRepository.findOne({ where: { id: userId } });

    const follow = await this.followsRepository.findOne({
      where: {
        followerId: follower.id,
        followingId: profile.id,
      },
    });

    if (!follow) {
      const follow = new FollowEntity();
      follow.followerId = userId;
      follow.followingId = profile.id;

      await this.followsRepository.save(follow);
    }

    return {
      ...profile,
      following: true,
    };
  }

  public async unfollow(profileName: string, userId: number): Promise<Profile> {
    const profile = await this.userRepository.findOne({ where: { username: profileName } });

    if (!profile) throw new NotFoundException('Profile not found');
    if (userId === profile.id) throw new BadRequestException('userId and profile cant be equal');

    await this.followsRepository.delete({
      followerId: userId,
      followingId: profile.id,
    });

    return {
      ...profile,
      following: false,
    };
  }

  public async getProfile(profileName: string, userId: number): Promise<Profile> {
    const profile = await this.userRepository.findOne({ where: { username: profileName } });
    if (!profile) throw new NotFoundException('Profile not found');

    const followPromise = this.followsRepository.findOne({
      where: {
        followerId: userId,
        followingId: profile.id,
      },
    });

    const allFollowPromise = this.followsRepository.find({
      where: {
        followingId: profile.id,
      },
    });

    const [follow, allFollow] = await Promise.all([followPromise, allFollowPromise]);

    return {
      ...profile,
      following: !!follow,
      followersCount: allFollow.length,
    };
  }

  public buildProfileResponse(profile: Profile): ProfileResponse {
    delete profile.email;
    return {
      profile,
    };
  }
}
