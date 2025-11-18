import { Controller, Get, Query } from '@nestjs/common';
import { ProfessorRequestSearchParamsDto } from './professor.model';
import { ProfessorService } from './professor.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserType } from 'generated/prisma';

@Controller('professor')
export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  @Get()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async searchProfessorsRequests(
    @Query() professorRequestSearchParamsDto: ProfessorRequestSearchParamsDto,
  ) {
    return await this.professorService.searchRequests(professorRequestSearchParamsDto);
  }
}
