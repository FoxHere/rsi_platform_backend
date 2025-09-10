import { SetMetadata } from "@nestjs/common";


export const IS_PUPLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUPLIC_KEY, true);