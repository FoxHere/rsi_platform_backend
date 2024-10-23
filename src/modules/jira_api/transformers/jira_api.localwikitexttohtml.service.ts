import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import sharp from 'sharp';
import { EncryptionService } from 'src/modules/utils/services/encryption.service';

@Injectable()
export class LocalWikitextToHtmlConverter {
  constructor(
    private readonly httpService: HttpService,
    private readonly encryptService: EncryptionService,
  ) {}

  extrancLinksToJson(text) {
    const linkRegex = /\[(.*?)\|(.*?)$\]|\[(.*?)\]+/g;
    let match: RegExpExecArray;
    let linkCount = 0;
    const links = [];

    while ((match = linkRegex.exec(text)) !== null) {
      linkCount++;
      const link_name =
        match[3].split('|')[1] !== undefined
          ? match[3].trim().split('|')[0].charAt(0).toUpperCase() +
            match[3].trim().split('|')[0].slice(1).toString()
          : `Link ${linkCount}`;
      const url = match[3].trim().split('|')[1]
        ? `<a href='${match[3].trim().split('|')[1]}'>${match[3].trim().split('|')[1]}</a>`
        : `<a href='${match[3].trim().split('|')[0]}'>${match[3].trim().split('|')[0]}</a>`;
      links.push({ link_name, link_source: url });
    }

    return links;
  }
  removeWiki(wikiText: string): string {
    let text: string = wikiText;
    if (text === null || text === '' || text === '_None_') {
      text = '';
    } else {
      text = text.replace(
        /h(\d)\. (.*?)(?=\r\n|$)/g,
        (match, level, content) => `$content`,
      );
      text = text.replace(/\s\_(.*?)\_\s/g, ' $1 ');
      // Converting underlined
      text = text.replace(/\+(.*?)\+/g, '$1');
      // Converting Strike
      text = text.replace(/\s-(.*?)-(\s?)/g, '$1');
      // Converting subscript
      text = text.replace(/~(.*?)~/g, '$1');
      // Converting superscript
      text = text.replace(/\^(.*?)\^/g, '$1');
      // Converting citations
      text = text.replace(/\?\?(.*?)\?\?/g, '$1');
      // converting mono spaced
      text = text.replace(/\{\{([A-Za-z\s]*?\}\})/g, '$1');
      // Converting color tag
      text = text.replace(/\{color:(.*?)\}(.*?)\{color\}/g, `$2`);
      // Converting bold
      text = text.replace(/\*(.*?)\*/g, '$1');
      // Converting code block
      text = text.replace(/{code:?.*}(.*?){code}/gs, '$1');
    }
    return text;
  }

  async conversor(wikiText: string, attachments: any[] = []): Promise<string> {
    let html = wikiText;

    if (html === null || html === '' || html === '_None_') {
      html = '';
    } else {
      //Adjustments
      //html = html.replace(//g, ' *');

      // Converting headers
      html = html.replace(
        /h(\d)\. (.*?)(?=\r\n|$)/g,
        (match, level, content) => `<h${level}>${content}</h${level}>`,
      );
      // Converting bold
      // html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
      // html = html.replace(/(?<!\*\s)\*([^*]+)\*/g, '<strong>$1</strong>');
      // Converting italic
      html = html.replace(/\s?\_(.*?)\_\s?/g, '<em> $1 </em>');
      // Converting underlined
      html = html.replace(/\+(\S.*?)\+/g, '<u>$1</u>'); //----------------- fixed by card GPDIP-387
      // Converting Strike
      html = html.replace(/\s-(\S.*?)-(\s?)/g, ' <del>$1</del> '); //----------------- fixed by card GPDIP-387
      // Converting subscript
      html = html.replace(/~(.*?)~/g, '<sub>$1</sub>');
      // Converting superscript
      html = html.replace(/\^(.*?)\^/g, '<sup>$1</sup>');

      // Converting citations
      html = html.replace(/\?\?(.*?)\?\?/g, '<cite>-$1</cite>');

      // converting mono spaced
      html = html.replace(/\{\{([A-Za-z\s]*?\}\})/g, '<tt>$1<tt/>');

      // Converting color tag
      html = html.replace(
        /\{color:(.*?)\}(.*?)\{color\}/g,
        `<span style='color:$1;'>$2</span>`,
      );

      html = html.replace('* \r\n||', '* ||'); // retirar o retorno de carro antes da table no caso de bulletlist
      html = html.replace(/(\*+) \r\n/g, '$1 ');

      html = html.replace('\r\n||', '<br>||');
      html = html.replace('|\r\n\r\n', '|\r\n');

      // ------------------------------------------------------------------- Converting Ordered list

      html = html.replace(/((?: \#+ .+?(?:\r\n|$))+)/g, (match, itemList) => {
        let items = itemList.trim().split('\r\n');
        items = items.map((item, index) =>
          index === 0 && item.charAt(0) !== ' ' ? ' ' + item : item,
        );

        let htmlList = '<ol>';
        let currentLevel = 1;

        items.forEach((item) => {
          // Tentativa segura de contar os asteriscos e preparar o conteúdo
          const matchResult = item.match(/^ (\#+)/);
          const level = matchResult ? matchResult[0].trim().length : 0;
          const content = item.trim().substring(level + 1); // Ajusta o índice corretamente
          while (level < currentLevel) {
            htmlList += '</ol>';
            currentLevel--;
          }
          while (level > currentLevel) {
            htmlList += '<ol>';
            currentLevel++;
          }
          htmlList += `<li>${content}</li>`;
        });
        while (currentLevel > 0) {
          htmlList += '</ol>';
          currentLevel--;
        }
        return htmlList;
      });
      // --------------------------------------------------------------------- Converting table

      // When we use tables we must replace the line break after piper in order to make sure the line break is for new lines and not
      // from content line breaks and we must garantee that table has a end to be replace using this custom tag TableFinalBreak
      html = html.replace(/\|\r\n\|/g, '|<TableLineBreak>|');
      html = html.replace(/\|\r\n/g, '|<TableFinalBreak>');

      const tabelaRegex =
        /(\|\|[\s\S]*?\|\|(?=<TableLineBreak>|$))([\s\S]*?)(?=(<TableFinalBreak>(?!\||\|\|)|$))/g;

      // const tabelaRegex =
      //   /(\|\|[\s\S]*?\|\|(?=\r\n|$))([\s\S]*?)(?=(\r\n(?!\||\|\|)|$))/g;

      /// /(\|\|[\s\S]*?\|\|(?=\r\n|$))([\s\S]*?)(?=(\r\n\|\||$))/g;

      html = html.replace(tabelaRegex, (match, headerPart, bodyPart) => {
        // Corrigindo a extração dos cabeçalhos para remover os delimitadores corretamente
        let headers = headerPart
          .replace(/^\|\||\|\|$/g, '')
          .split('||')
          .map((h) => h.trim());
        let headerHtml =
          '<thead><tr>' +
          headers.map((h) => `<th>${h}</th>`).join('') +
          '</tr></thead>';
        // Processar corpo
        let bodyHtml =
          '<tbody>' +
          bodyPart
            .trim()
            .split(/<TableLineBreak>(?=\|)/)
            .map((row) => {
              let cells = row
                .split('|')
                .slice(1)
                .filter((cell) => cell.trim())
                .map((cell) => {
                  // Convertendo quebras de linha internas para <br> para manutenção de formatação
                  return `<td>${cell.trim().replace(/\r\n/g, '<br>')}</td>`;
                })
                .join('');
              return '<tr>' + cells + '</tr>';
            })
            .join('') +
          '</tbody>';
        // Montar a tabela completa
        return `</div><br><table>${headerHtml}${bodyHtml}</table><div>`;
      });
      html = html.replace('<TableFinalBreak>', '<br>');
      // ------------------------------------------------------------------- Converting Bullet list
      // A conversão de tabelas precisa estar em primeiro pois assim a tabela já convertida pode
      // ser reconhecida dentro do bulletlist
      // QUESTION: Seria esse um processo de melhoria?

      const bulletListRegex = /((?: \*+ .+?(?:\r\n|$))+(?:\|.+?(?:\r\n|$))*)/g;
      html = html.replace(bulletListRegex, (match, itemList) => {
        let items = itemList.trim().split('\r\n'); // separamos os items em um arrays de items
        let htmlList = ''; // aqui é onde ficará o html com os items
        let currentLevel = 0; // vamos iniciar o level em 0 pois é o item pai
        let stack = []; // a stack aqui é usada para manter controle das tags que precisam ser fechadas
        // interamos cada item na stack
        items.forEach((item) => {
          const matchResult = item.match(/^ (\*+)/); // procuramos os item caso ele iniciar sem espaço então ele
          const level = matchResult ? matchResult[0].trim().length : 0; // se o matchResult for nulo então determinamos que o level é 0
          const content = item.trim().substring(level + 1); // aqui pegamos somente o valor do item

          // se o level do item for maior do que o level atual então abre mais uma ul
          if (level > currentLevel) {
            while (level > currentLevel) {
              htmlList += '<ul><li>';
              stack.push('</li></ul>'); // aqui incrementamos a stack com as tags de fechamento do ul em forma de texto no array
              currentLevel++;
            }
            // se o level do item for menor do que o level atual então fecha a li
          } else if (level < currentLevel) {
            while (level < currentLevel) {
              htmlList += stack.pop(); // nesse caso vamos fechar a tag ul e li dando um pop na stack
              currentLevel--; // e diminuimos o level atual para o level pai
            }
            htmlList += '</li><li>';
          } else {
            // caso o level atual for maior do que 0 significa que está no mesmo nivel então só precisamos fechar o li anterior e abrir outro li
            if (currentLevel > 0) {
              htmlList += '</li><li>';
            } else {
              htmlList += '<ul><li>'; // start the list if not already started
              stack.push('</li></ul>'); // push the closing tag to stack
              currentLevel = 1;
            }
          }
          htmlList += '<div>' + content.trim() + '</div>';
        });
        while (stack.length > 0) {
          htmlList += stack.pop();
        }
        return '</div>' + htmlList + '<div>';
      });
      // html = html.replace(/((?: \*+ .+?(?:\r\n|$))+)/g, (match, itemList) => {
      //   // Breaking text into array
      //   let items = itemList.trim().split('\r\n');
      //   // insert space in he first item of this list
      //   items = items.map((item, index) =>
      //     index === 0 && item.charAt(0) !== ' ' ? ' ' + item : item,
      //   );

      //   let htmlList = '<ul>';
      //   let currentLevel = 1;

      //   items.forEach((item) => {
      //     // Tentativa segura de contar os asteriscos e preparar o conteúdo
      //     const matchResult = item.match(/^ (\*+)/);
      //     const level = matchResult ? matchResult[0].trim().length : 0;
      //     const content = item.trim().substring(level + 1); // Ajusta o índice corretamente
      //     while (level < currentLevel) {
      //       htmlList += '</ul>';
      //       currentLevel--;
      //     }
      //     while (level > currentLevel) {
      //       htmlList += '<ul>';
      //       currentLevel++;
      //     }
      //     htmlList += `<li>${content}</li>`;
      //     // htmlList += `<li><div><span>${content}</span></div></li>`;
      //   });
      //   while (currentLevel > 0) {
      //     htmlList += '</ul>';
      //     currentLevel--;
      //   }
      //   return htmlList;
      // });
      // ------------------------------------------------------------------ Ordered list original

      // html = html.replace(/(( \# .+?(?:\r\n|$))+)/g, (match, itemList) => {
      //   const items = itemList
      //     .trim()
      //     .split('\r\n')
      //     .map((item) => item.trim().substring(2));
      //   const htmlList = items.map((item) => `<li>${item}</li>`).join('');
      //   return `<ol>${htmlList}</ol>`;
      // });

      // ------------------------------------------------------------------- Bullet list original
      // html = html.replace(/(( \* .+?(?:\r\n|$))+)/g, (match, itemList) => {
      //   const items = itemList
      //     .trim()
      //     .split('\r\n')
      //     .map((item) => item.trim().substring(2));
      //   const htmlList = items.map((item) => `<li>${item}</li>`).join('');
      //   return `<ul>${htmlList}</ul>`;
      // });

      // -----------------------------------------------------------------------------------
      // Converting bold
      html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
      // Converting code block
      html = html.replace(
        /{code:?.*}(.*?){code}/gs,
        '<pre><code>$1</code></pre>',
      );

      // Converting bold
      // html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
      // Converting links 1
      //html = html.replace(/\[(.*?)\|(.*?)\]/gm, '<a href="$2">$1</a>');
      // Converting links 2
      //html = html.replace(/\[(.*?)\]/gm, '<a href="$1">$1</a>');

      // Converting carriage return and line feed (\r\n) to line break (<br>) 2x
      html = html.replace(/(\r\n\r\n)/g, '<br>');
      // Converting carriage return and line feed (\r\n) to line break (<br>)
      html = html.replace(/(\r\n)/g, '<br>');
      // Trash cleaning
      html = html.replace(/\{/g, '');
      html = html.replace(/\}/g, '');
      html = html.replace(/\n/g, '');
      html = html.replace(/\r/g, '');
      // -------------------------------------------------------------------- Convert images
      // This is a particular case, because of promises we'll have to store image matches first
      // then use its matches to replace its location
      // First we need to detect if there images in our field--------------------------------
      const imageMatches = [...html.matchAll(/!(.*?)!/g)];
      // if this images are not empty then process them
      if (imageMatches.length > 0) {
        // All detected images will be promisses so we'll map them all
        // here we will return a map with old and new keys to replace it further
        const imagePromises = imageMatches.map(async (match) => {
          const imageRef = match[1]; // extract image name, with width and height only
          var hasSize: boolean = imageRef.split('|')[1] ? true : false;
          const imageProps = this.extractImageAttachments(imageRef, hasSize); // call this function to extract image props in a map
          // now we loop through each attachments to match it
          for (let element of attachments) {
            // if match the same image reference in text then...
            if (element['filename'] === imageProps[0].name) {
              // Request image by link, resize it by width and height and encrypt it in base64
              const base64Image = await this.resizeAndConvertToBase64(
                element['content'],
                imageProps[0].width,
                imageProps[0].height,
              );
              // Return a map with old and new keys to replace it further
              return {
                old: match[0],
                new: `</div><img src="${base64Image}" alt="${imageProps[0].name}" /><div>`,
              };
            }
          }
          // if there is no match with attachments then return original
          return { old: match[0], new: match[0] };
        });

        // now we promise them all (wait to be used by replacements)
        const replacements = await Promise.all(imagePromises);

        // finally we loop through replacements replacing the image location with the new encrypted image
        replacements.forEach((replacements) => {
          html = html.replace(replacements.old, replacements.new);
        });
      }
      // ---------------------------------------------------------------------------------------
      // html = html.replace(/!(.*?)!/g,  (match, imageRef) => {
      //   //const imageProps = imageRef.split('|');
      //   let base64Image = '';
      //   const imageProps = this.extractImageAttachments(imageRef);
      //   // TODO: Lembrar de pegar a altura e largura da imagem e passar nessa nova função
      //   // Assim diminuiremos o tamanho da imagem antes de transformar em base64

      //   attachments.forEach(async (element) => {
      //     if (element['filename'] == imageProps[0].name) {
      //       base64Image = await this.resizeAndConvertToBase64(
      //         element['content'],
      //         imageProps[0].width,
      //         imageProps[0].height,
      //       );
      //       // TODO: Construir uma funçao para buscar essa imagem na url que vem de element['filename']
      //       // usando o httpService já configurado no model
      //       // TODO: Fazer o resize dessa imagem e transformar em base64
      //     }
      //   });
      //   return base64Image;
      // });
      html = `<div>${html}</div>`;

      // Inversion because of lists and tables
      html = html.replace('<br></div>', '</div><br>');
      html = html.replace('<div><br>', '<br><div>');
      // html = html.replace('</div><br><ul>', '</div><ul>');
      // html = html.replace('</div><br><ol>', '</div><ol>');
    }
    // html return
    return html;
  }

  // function to create a map of images with props
  extractImageAttachments(
    imageText: string,
    hasSize: boolean,
  ): { name: string; width: number; height: number }[] {
    const regex = hasSize
      ? /(.*?\.(png|jpg|jpeg|gif|webp))\|width=(\d+),height=(\d+)/gi
      : /(.*?\.(png|jpg|jpeg|gif|webp))/gi;
    let match = [];
    const images = [];

    while ((match = regex.exec(imageText)) !== null) {
      images.push({
        name: match[1],
        width: hasSize ? parseInt(match[3], 10) : 0,
        height: hasSize ? parseInt(match[4], 10) : 0,
      });
    }
    return images;
  }

  async extractDocAttachments(
    attachments: any[],
  ): Promise<
    { fileName: string; fileId: string; file_size: string; file_type: string }[]
  > {
    // Create a list of attachments
    const documents = [];
    // Mapp all attachments and push it to document list
    attachments.map((attachment) => {
      documents.push({
        file_name: attachment.filename,
        // Implement right here to encryption function to encrypt the Id before send it
        file_id: this.encryptService.encrypt(attachment.id),
        file_size: attachment.size.toString(),
        //file_type: attachment.mimeType,
      });
    });

    return documents;
  }

  async resizeAndConvertToBase64(
    url: string,
    width: number,
    height: number,
  ): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
        }),
      );
      var resizedImage;
      // Resizing and convert from png to webp image to reduce its size before encryptation
      if (width === 0) {
        resizedImage = await sharp(Buffer.from(response.data))
          .toFormat('webp', { quality: 80 })
          .toBuffer();
      } else {
        resizedImage = await sharp(Buffer.from(response.data))
          .resize(width, height)
          .toFormat('webp', { quality: 80 })
          .toBuffer();
      }

      return `data:image/webp;base64,${resizedImage.toString('base64')}`;
    } catch (error) {
      console.error('Failed', error);
      throw error;
    }
  }
}
