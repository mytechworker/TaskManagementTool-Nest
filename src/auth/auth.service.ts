import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ token: string }> {
    try {
      const { name, email, password } = signUpDto;
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user instance
      const newUser = new this.userModel({
        name,
        email,
        password: hashedPassword,
      });

      // Save the user to the database
      const savedUser = await newUser.save();

      // Generate JWT token
      const token = this.jwtService.sign({ id: savedUser._id });

      // Store the token in the user document
      savedUser.token = token;
      await savedUser.save();

      // Return the token
      return { token };
    } catch (error) {
      // Handle specific error types with exception filters
      if (error.code === 11000) {
        // Duplicate key error
        throw new ConflictException('Email already exists');
      } else {
        // Throw a generic exception for other errors
        throw new InternalServerErrorException('Failed to create user');
      }
    }
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ token: string; uid: string; name: string }> {
    const { email, password } = loginDto;

    try {
      const user = await this.userModel.findOne({ email });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordMatched = await bcrypt.compare(password, user.password);

      if (!isPasswordMatched) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate JWT token
      const token = this.jwtService.sign({ id: user._id });

      // Store the token in the user document
      user.token = token;
      await user.save();

      return { token, uid: user._id, name: user.name }; // Include userId in the response
    } catch (error) {
      // Handle specific error types with exception filters
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  async logout(authorizationHeader: string): Promise<void> {
    try {
      // Extract token from the Authorization header
      const token = authorizationHeader.split(' ')[1]; // Extracting the token part after "Bearer "
      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }
      const userId = this.getUserIdFromToken(token);
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.token = null;
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private getUserIdFromToken(token: string): string {
    try {
      const decodedToken = this.jwtService.decode(token);
      if (
        !decodedToken ||
        typeof decodedToken !== 'object' ||
        !decodedToken.hasOwnProperty('id')
      ) {
        throw new UnauthorizedException('Invalid token');
      }
      return decodedToken.id;
    } catch (error) {
      // Handling specific error types with exception filters
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throwing the caught exception
      } else {
        throw new InternalServerErrorException('Internal server error');
      }
    }
  }
}
