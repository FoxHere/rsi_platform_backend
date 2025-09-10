import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { SCOPES_KEY } from "../decorators/scopes.decorator";


@Injectable()
export class ScopesGuard implements CanActivate{

    constructor(private reflector: Reflector ){}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.get<string[]>(SCOPES_KEY, context.getHandler()) || [];
        if(!required) return true;

        const req = context.switchToHttp().getRequest();
        const tokenScopes: string[] = req.user?.scp || [];

        const ok = required.every(scope => tokenScopes.includes(scope));
        if(!ok) throw new ForbiddenException('Insufficient Scope');
        return true;
    }
}