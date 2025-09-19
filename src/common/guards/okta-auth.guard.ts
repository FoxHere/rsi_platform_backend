import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import OktaJwtVerifier from "@okta/jwt-verifier";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class OktaAuthGuard implements CanActivate {


    constructor(private configService: ConfigService, private reflector: Reflector) { }

    private verifier = new OktaJwtVerifier({
        issuer: this.configService.get<string>('OKTA_ISSUER'),
        clientId: this.configService.get<string>('OKTA_CLIENT_ID')
    });


    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Verify if the endpoint has public decorator
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        // Get the token from header
        const req = context.switchToHttp().getRequest();
        const auth = (req.headers['authorization'] || req.headers['Authorization']) as string || undefined;
        if (!auth || !auth.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing Bearer token');
        }

        const token = auth.slice(7);

        // Validate the token using Okta VerifyAccessToken function;
        try {
            const jwt = await this.verifier.verifyAccessToken(token, this.configService.get<string>('OKTA_AUDIENCE'))
            req.user = jwt.claims;
            return true;
        } catch (e) {
            throw new UnauthorizedException(e?.message || 'Invalid access token')
        }
    }

}