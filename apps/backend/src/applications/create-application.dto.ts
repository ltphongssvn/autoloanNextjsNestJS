// apps/backend/src/applications/create-application.dto.ts
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class CreateApplicationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  loanAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  loanTerm?: number;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
