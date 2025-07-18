/*
    Controlling which content is shown/hidden on a Release page will be governed by the following rules: 
    1 - Always Display
        If Content exists:
            Content and Tabs are always displayed/clickable for both GPD Internal, and Clients
        If no Content exists (Jira field is Empty or "<None>")
            Tabs, "headers", and Content are hidden for both GPD Internal and Client users
        note: a Release will not show up to a logged in client until at least Pre-Delivery has been achieved, so prior to that, even "Always Display" fields can not be seen by a logged in client
    2 - Display when Applicable
        If Display Status for the field is "Not Applicable"
            Content and Tabs are hidden
            Note: it would be nice to get a warning in Jira if Status is Not Applicable, but Content exists.
        If Display Status for the field is "Applicable"
            Internal User 
                If Content exists: Tab and Content Displayed/Clickable
                If no Content exists (Jira field is Empty or "<None>"), Tab and Content are hidden
            Client
                If Client Delivery Status is NOT "Delivered":
                    Content and Tabs are hidden
                If Client Delivery Status is "Delivered":
                    Tabs visible and clickable;  Content is displayed.
    */

import { Injectable } from '@nestjs/common';
import { TrasformerJirawikiToHtml } from '../transformers/transformers.jirawiki_to_html.service';
import { LinksStyle } from '../transformers/link_style.interface';
import { DocumentAttachments } from '../transformers/doc_attachments.interface';

interface RulesParam {
  needConversor?: boolean;
  isWikiRemoval?: boolean;
  attachments?: any[];
}

@Injectable()
export class DisplayRules {
  constructor(private localTransform: TrasformerJirawikiToHtml) {}

  private isValidString(input: any): boolean {
    return (
      typeof input === 'string' &&
      input.trim() !== '' &&
      input.trim().toLowerCase() !== '<none>' &&
      input.trim().toLowerCase() !== '_none_' &&
      input.trim().toLowerCase() !== '0' &&
      input.trim().toLowerCase() !== null
    );
  }

  private isValidArray(array: any): boolean {
    return Array.isArray(array) && array.length > 0;
  }

  private isApplicableField(applicableField: string): boolean {
    return (
      this.isValidString(applicableField) &&
      applicableField.trim().toLowerCase() === 'applicable'
    );
  }

  keyDisplay(productLine: string, key: string): string {
    return `Update ID: ${productLine}${key.split('-')[1].padStart(7, '0')}`;
  }

  async alwaysDisplay(
    jiraField: string,
    attachments = [],
    needConversor = false,
    isWikiRemoval = false,
  ): Promise<string> {
    if (this.isValidString(jiraField)) {
      if (isWikiRemoval) {
        return await this.localTransform.removeWiki(jiraField);
      }
      if (needConversor) {
        const ImagesAttachment = this.extractImageAttachments(attachments);
        return await this.localTransform.conversor(jiraField, ImagesAttachment);
      }
    }

    return '';
  }
  async displayWhenApplicable(
    jiraField: string,
    isApplcableField: string,
    attachments: any[] = [],
    needConversor: boolean = false,
    isWikiRemoval: boolean = false,
    isTemplate: boolean = false,
    templateFields?: TemplateReplacement,
  ): Promise<string> {
    if (this.isValidString(jiraField)) {
      var jiraRawField = jiraField;

      if (this.isApplicableField(isApplcableField)) {
        if (isTemplate) {
          jiraRawField = await this.localTransform.templateReplacement(
            jiraField,
            templateFields,
          );
        }
        if (isWikiRemoval) {
          return await this.localTransform.removeWiki(jiraRawField);
        }
        if (needConversor) {
          const ImagesAttachment = this.extractImageAttachments(attachments);
          return await this.localTransform.conversor(
            jiraRawField,
            ImagesAttachment,
          );
        }
      }
    }
    return '';
  }

  displayLinks(jiraField: string): LinksStyle[] {
    if (this.isValidString(jiraField)) {
      return this.localTransform.extrancLinksToJson(jiraField);
    }
    return [];
  }

  async displayAttachments(attachments: any[]): Promise<DocumentAttachments[]> {
    if (this.isValidArray(attachments)) {
      return await this.localTransform.extractDocAttachments(attachments);
    }
    return [];
  }

  async displayLegislativeAttachments(attField: string, attachments: any[]) {
    if (this.isValidString(attField)) {
      return await this.localTransform.extractLegisativeAttachments(
        attField,
        attachments,
      );
    }
    return [];
  }

  private extractImageAttachments(attachments: any[]): string[] {
    return attachments
      .filter((attachment) => attachment.mimeType.startsWith('image'))
      .map((attachment) => attachment);
  }
}
