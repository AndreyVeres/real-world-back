import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { UserResponse } from './types/userResponse.interface';
import { LoginUserDto } from './dto/loginUser.dto';
import { compare } from 'bcrypt';
import { UpdateUserDto } from './dto/updateUser.dto';
import { config } from 'dotenv';
config();
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findOne({ where: { email: createUserDto.email } }),
      this.userRepository.findOne({
        where: { username: createUserDto.username },
      }),
    ]);

    if (existingEmail) {
      throw new BadRequestException(`user with email ${createUserDto.email} already exists`);
    }

    if (existingUsername) {
      throw new BadRequestException(`user with name ${createUserDto.username} already exists`);
    }

    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);

    return await this.userRepository.save(newUser);
  }

  public buildUserResponse(user: UserEntity): UserResponse {
    delete user.password;

    const { id, username, email } = user;

    return {
      user: {
        ...user,
        token: sign({ id, username, email }, process.env.JWT_SECRET),
      },
    };
  }

  public async login(userCredentials: LoginUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { email: userCredentials.email },
      select: ['bio', 'email', 'id', 'image', 'password', 'username'],
    });

    if (!user) throw new BadRequestException('invalid credentials');

    const isCorrectPassword = await compare(userCredentials.password, user.password);

    if (!isCorrectPassword) throw new BadRequestException('invalid credentials');

    return user;
  }

  public async findById(id: number): Promise<UserEntity> {
    return await this.userRepository.findOne({ where: { id } });
  }

  public async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }
}
