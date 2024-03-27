import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './schemas/task.schema';

import { Query as ExpressQuery } from 'express-serve-static-core';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  async getAllTasks(@Query() query: ExpressQuery): Promise<Task[]> {
    return this.taskService.findAll(query);
  }

  @Post()
  @UseGuards(AuthGuard())
  async createTask(
    @Body()
    task: CreateTaskDto,
    @Req() req,
  ): Promise<Task> {
    return this.taskService.create(task, req.user);
  }

  @Get(':id')
  async getTask(
    @Param('id')
    id: string,
  ): Promise<Task> {
    return this.taskService.findById(id);
  }

  @Put(':id')
  async updateTask(
    @Param('id')
    id: string,
    @Body()
    task: UpdateTaskDto,
  ): Promise<Task> {
    return this.taskService.updateById(id, task);
  }

  @Delete(':id')
  async deleteTask(
    @Param('id')
    id: string,
  ): Promise<Task> {
    return this.taskService.deleteById(id);
  }

  @Get('findByUser/:userId') // Modified route to find tasks by user ID
  async findTasksByUserId(@Param('userId') userId: string): Promise<Task[]> {
    return this.taskService.findTasksByUserId(userId);
  }
}
