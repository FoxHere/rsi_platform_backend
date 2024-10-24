import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  constructor(private configService: ConfigService) {}

  private readonly algorithm = 'aes-256-ctr';
  private readonly secretKey = Buffer.from(
    this.configService.get<string>('ENCRYPTION_KEY'),
    'hex',
  );
  encrypt(value: string): string {
    // We have to create a iv to send it with encrypted document id
    // So that we can decrypt it back to original one
    const iv = crypto.randomBytes(16);
    // Then now we create a cipher const using document id string from the function param
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    // Let's encrypt this string using cipher
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(value.toString())),
      cipher.final(),
    ]);
    // Finaly we send this iv and encrypted number back to the requested service
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(value: string): string {
    // Split value into iv and encrypted value
    const parts = value.split(':');
    // Extract iv from the first part
    const iv = Buffer.from(parts[0], 'hex');
    // Extract encrypted text from the last part
    const encryptedText = Buffer.from(parts[1], 'hex');
    // create a decipher using algorithm, secretKey and iv from the first value of parts
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      iv,
    );
    // decipher value using decipher
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    // Return the final value
    return decrypted.toString();
  }
}
