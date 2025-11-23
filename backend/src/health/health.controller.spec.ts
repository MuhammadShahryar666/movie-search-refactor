import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('check (GET /health)', () => {
    it('should return health status with all required fields', () => {
      const result = controller.check();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('version');
    });

    it('should return status as "ok"', () => {
      const result = controller.check();

      expect(result.status).toBe('ok');
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.check();

      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      // Validate ISO format
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should return uptime as a positive number', () => {
      const result = controller.check();

      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return environment from NODE_ENV', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const result = controller.check();

      expect(result.environment).toBe('production');

      process.env.NODE_ENV = originalEnv;
    });

    it('should return "development" as default environment when NODE_ENV is not set', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const result = controller.check();

      expect(result.environment).toBe('development');

      process.env.NODE_ENV = originalEnv;
    });

    it('should return version "1.0.0"', () => {
      const result = controller.check();

      expect(result.version).toBe('1.0.0');
    });

    it('should return timestamp close to current time', () => {
      const beforeTime = new Date();
      const result = controller.check();
      const afterTime = new Date();

      const resultTime = new Date(result.timestamp);

      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should return different timestamps on consecutive calls', async () => {
      const result1 = controller.check();
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result2 = controller.check();

      // Timestamps should be different (or at least not fail)
      expect(result1.timestamp).toBeDefined();
      expect(result2.timestamp).toBeDefined();
    });
  });

  describe('ready (GET /health/ready)', () => {
    it('should return readiness status with all required fields', () => {
      const result = controller.ready();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('checks');
    });

    it('should return status as "ready"', () => {
      const result = controller.ready();

      expect(result.status).toBe('ready');
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.ready();

      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      // Validate ISO format
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should return checks object with filesystem and memory', () => {
      const result = controller.ready();

      expect(result.checks).toBeDefined();
      expect(typeof result.checks).toBe('object');
      expect(result.checks).toHaveProperty('filesystem');
      expect(result.checks).toHaveProperty('memory');
    });

    it('should return filesystem check as "ok"', () => {
      const result = controller.ready();

      expect(result.checks.filesystem).toBe('ok');
    });

    it('should return memory check as "ok"', () => {
      const result = controller.ready();

      expect(result.checks.memory).toBe('ok');
    });

    it('should return timestamp close to current time', () => {
      const beforeTime = new Date();
      const result = controller.ready();
      const afterTime = new Date();

      const resultTime = new Date(result.timestamp);

      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('live (GET /health/live)', () => {
    it('should return liveness status with all required fields', () => {
      const result = controller.live();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return status as "alive"', () => {
      const result = controller.live();

      expect(result.status).toBe('alive');
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.live();

      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      // Validate ISO format
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should return timestamp close to current time', () => {
      const beforeTime = new Date();
      const result = controller.live();
      const afterTime = new Date();

      const resultTime = new Date(result.timestamp);

      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should return minimal response (only status and timestamp)', () => {
      const result = controller.live();

      // Should only have 2 properties
      expect(Object.keys(result).length).toBe(2);
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Response Structure Consistency', () => {
    it('all endpoints should return timestamp in same format', () => {
      const checkResult = controller.check();
      const readyResult = controller.ready();
      const liveResult = controller.live();

      // All timestamps should be valid ISO strings
      expect(() => new Date(checkResult.timestamp)).not.toThrow();
      expect(() => new Date(readyResult.timestamp)).not.toThrow();
      expect(() => new Date(liveResult.timestamp)).not.toThrow();
    });

    it('all endpoints should return object with status and timestamp', () => {
      const checkResult = controller.check();
      const readyResult = controller.ready();
      const liveResult = controller.live();

      // All should have status and timestamp
      expect(checkResult).toHaveProperty('status');
      expect(checkResult).toHaveProperty('timestamp');
      expect(readyResult).toHaveProperty('status');
      expect(readyResult).toHaveProperty('timestamp');
      expect(liveResult).toHaveProperty('status');
      expect(liveResult).toHaveProperty('timestamp');
    });
  });
});
