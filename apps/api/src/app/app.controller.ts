import { Controller, Get } from '@nestjs/common';
import type { BootstrapResponse, HealthResponse } from '@heimdall/contracts';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('bootstrap')
  getBootstrap(): BootstrapResponse {
    return this.appService.getBootstrap();
  }

  @Get('health')
  getHealth(): Promise<HealthResponse> {
    return this.appService.getHealth();
  }
}
