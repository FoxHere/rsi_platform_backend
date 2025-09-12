import { HttpService } from '@nestjs/axios';
import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    HttpException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import OktaJwtVerifier from '@okta/jwt-verifier';
import {
    catchError,
    firstValueFrom,
    from,
    map,
    Observable,
    of,
    switchMap,
    throwError,
} from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class OktaAuth2Guard implements CanActivate {
    private introspectUrl: string;
    private clientId: string;
    private clientSecret: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly reflector: Reflector,
        private readonly httpService: HttpService,
    ) {
        const issuer = this.configService.get<string>('OKTA_ISSUER');
        if (!issuer) throw new Error('Missing Okta Issuer in environment');

        this.introspectUrl = `${issuer}/oauth2/v1/introspect`;
        this.clientId = this.configService.get<string>('OKTA_CLIENT_ID');
        this.clientSecret = this.configService.get<string>('OKTA_CLIENT_SECRET');
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPulic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPulic) return Promise.resolve(true);

        const req = context.switchToHttp().getRequest();
        const auth = (req.headers['authorization'] ||
            req.headers['authorization']) as string | undefined;
        if (!auth || !auth.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing Bearer token');
        }
        const token = auth.slice(7);

        try {
            const body = new URLSearchParams({
                token,
                token_type_hint: 'access_token',
            });

            const authHeaderBasic = Buffer.from(
                `${this.clientId}:${this.clientSecret}`,
            ).toString('base64');

            return await firstValueFrom(
                this.httpService
                    .post(this.introspectUrl, body.toString(), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Authorization: `Basic ${authHeaderBasic}`,
                        },
                    })
                    .pipe(
                        map((response) => {
                            const data = response.data;
                            if (!data.active)
                                throw new UnauthorizedException('Token is inactive or invalid');
                            req.user = data;
                            return true;
                        }),
                        catchError((err) => {
                            if (err.response?.status === 400) {
                                return throwError(
                                    () => new BadRequestException('Token introspection failed'),
                                );
                            }
                            if (err instanceof HttpException) {
                                return throwError(() => err);
                            }
                            return throwError(
                                () =>
                                    new InternalServerErrorException('Unexpected error occurred'),
                            );
                        }),
                    ),
            );
        } catch (e) {
            throw new UnauthorizedException(e?.message || 'Invalid access token');
        }
    }
}
