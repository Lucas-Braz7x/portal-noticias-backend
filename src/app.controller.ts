import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpCache } from './shared/presentation/decorators/http-cache.decorator';
import { AppService } from './app.service';
import { HealthResponseDto } from './app/dto/health-response.dto';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @HttpCache({ noStore: true })
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ type: HealthResponseDto })
  async health() {
    return this.appService.getHealth();
  }
}
