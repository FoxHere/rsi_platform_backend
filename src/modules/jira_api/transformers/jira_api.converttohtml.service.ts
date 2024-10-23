import { HttpService } from '@nestjs/axios';
import axios, { AxiosRequestConfig } from 'axios';
import * as https from 'https';
import { map } from 'rxjs';

export class JiraConvertToHtml {
  constructor(private readonly httpService: HttpService) {}

  async processIssueField(issueField: string) {
    const axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Ignora erros de certificado SSL
      }),
    });

    // const config = {
    //   method: 'post',
    //   url: 'https://jiraqa/rest/api/1.0/render',

    //   data: {
    //     rendererType: 'atlassian-wiki-renderer',
    //     unrenderedMarkup: issueField,
    //   },
    // };
    try {
      const response = await axiosInstance('config');
      console.log('Data:', response.data);
      return response.data; // O HTML convertido
    } catch (error) {
      console.error('Error converting markup:', error);
      console.log('Erro:', error);
      throw error; // Propaga o erro para ser tratado onde a função é chamada
    }
  }
}
