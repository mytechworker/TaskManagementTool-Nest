import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Task } from './schemas/task.schema';
import { Query } from 'express-serve-static-core';
import { User } from '../auth/schemas/user.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: mongoose.Model<Task>,
  ) {}
  async findAll(query: Query): Promise<Task[]> {
    try {
      const resPerPage = 2;
      const currentPage = Number(query.page) || 1;
      const skip = resPerPage * (currentPage - 1);

      const keyword = query.keyword
        ? {
            title: {
              $regex: query.keyword,
              $options: 'i',
            },
          }
        : {};

      const tasks = await this.taskModel
        .find({ ...keyword })
        .limit(resPerPage)
        .skip(skip);

      return tasks;
    } catch (error) {
      // Handle the error appropriately
      console.error('An error occurred while fetching tasks:', error);
      throw error; // rethrowing the error for the caller to handle
    }
  }

  async create(task: Task, user: User): Promise<Task> {
    try {
      const data = Object.assign(task, { user: user._id });
      const res = await this.taskModel.create(data);
      return res;
    } catch (error) {
      console.error('An error occurred while creating task:', error);
      throw new InternalServerErrorException('Failed to create task.');
    }
  }

  async findById(id: string): Promise<Task> {
    try {
      const isValidId = mongoose.isValidObjectId(id);
      if (!isValidId) {
        throw new BadRequestException('Please enter correct id.');
      }

      const task = await this.taskModel.findById(id);
      if (!task) {
        throw new NotFoundException('Task not found.');
      }

      return task;
    } catch (error) {
      console.error('An error occurred while finding task by id:', error);
      throw error;
    }
  }

  async updateById(id: string, task: Task): Promise<Task> {
    try {
      const updatedTask = await this.taskModel.findByIdAndUpdate(id, task, {
        new: true,
        runValidators: true,
      });

      if (!updatedTask) {
        throw new NotFoundException('Task not found.');
      }

      return updatedTask;
    } catch (error) {
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new BadRequestException('Invalid task ID format.');
      } else if (error.name === 'ValidationError') {
        // Handle validation errors
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message,
        );
        throw new UnprocessableEntityException(validationErrors);
      } else {
        console.error('An error occurred while updating task by ID:', error);
        throw new InternalServerErrorException('Failed to update task.');
      }
    }
  }

  async deleteById(id: string): Promise<Task> {
    try {
      const deletedTask = await this.taskModel.findByIdAndDelete(id);

      if (!deletedTask) {
        throw new NotFoundException('Task not found.');
      }

      return deletedTask;
    } catch (error) {
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new BadRequestException('Invalid task ID format.');
      } else {
        console.error('An error occurred while deleting task by ID:', error);
        throw new InternalServerErrorException('Failed to delete task.');
      }
    }
  }

  async findTasksByUserId(userId: string): Promise<Task[]> {
    try {
      const tasks = await this.taskModel.find({ user: userId });
      if (!tasks) {
        throw new NotFoundException('No tasks found for the given user ID.');
      }
      return tasks;
    } catch (error) {
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new BadRequestException('Invalid user ID format.');
      } else {
        console.error("An error occurred while finding tasks by user ID:", error);
        throw new InternalServerErrorException('Failed to find tasks by user ID.');
      }
    }
  }
}
