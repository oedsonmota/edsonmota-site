# Ligar os formulários do site

Os formulários de Aplicar e da lista INQUIETOS já estão no site. Falta um endereço gratuito do Google para receber as respostas. Este passo a passo faz isso. Não precisa pagar o Typeform e não tem senha dentro do site.

O que acontece quando alguém envia:

- a resposta entra numa planilha do Google (uma aba para aplicação, outra para INQUIETOS)
- você recebe um e-mail em contato.edsonmota@gmail.com
- a aplicação também vira um card no Notion, no CRM · Leads
- a lista INQUIETOS fica só na planilha

Se o Notion falhar, a planilha e o e-mail continuam.

Esta pasta não aparece no edsonmota.com. Ela fica só no repositório, para você copiar o código.

## 1. Criar a planilha

1. Abra [Google Planilhas](https://sheets.google.com) e crie uma planilha em branco.
2. Dê o nome que quiser, por exemplo `Leads edsonmota.com`.
3. Não precisa criar as abas nem a primeira linha. O código cria a aba `Aplicação`, a aba `INQUIETOS` e os títulos das colunas na primeira resposta.

## 2. Colar o código

1. Na planilha, vá em **Extensões** e depois **Apps Script**.
2. Apague o que estiver no arquivo `Código.gs`.
3. Abra o arquivo `Code.gs` desta pasta e copie tudo.
4. Cole no Apps Script e salve (o ícone de disquete, ou Ctrl+S).

## 3. Avisar o Notion

O card da aplicação usa o banco **CRM · Leads**.

1. Abra [notion.so/my-integrations](https://www.notion.so/my-integrations) e crie uma integração. O nome pode ser `Site edsonmota`.
2. Copie o token. Ele começa com `ntn_` ou `secret_`. Guarde num lugar seu. Não cole no site nem neste repositório.
3. No Notion, abra o **CRM · Leads**.
4. No canto superior, em **Compartilhar** (ou nos três pontinhos), convide a integração que você acabou de criar. Sem esse convite, o card não é criado.

## 4. Guardar o token nas propriedades

Ainda no Apps Script:

1. Clique na engrenagem **Configurações do projeto**.
2. Abra **Propriedades do script**.
3. Adicione duas propriedades:

| Propriedade | Valor |
| --- | --- |
| `NOTION_TOKEN` | o token da integração |
| `NOTION_DATA_SOURCE_ID` | `9a9ba651-d1a9-49c4-885f-f2211a455f0a` |

Não coloque aspas. Salve.

`SHEET_ID` só é necessário se o script não estiver aberto de dentro da planilha. No caminho deste passo a passo, pode deixar em branco.

## 5. Publicar o endereço

1. No Apps Script, clique em **Implantar** e depois **Nova implantação**.
2. No tipo, escolha **App da Web**.
3. **Executar como:** Eu.
4. **Quem pode acessar:** Qualquer pessoa.
5. Clique em **Implantar**. Na primeira vez, o Google pede autorização. Aceite o acesso à planilha, ao envio de e-mail e às conexões externas.
6. Copie a URL do app da Web. Ela termina com `/exec`.

Se você mudar o código depois, use **Gerenciar implantações**, edite a implantação e escolha **Nova versão**. A URL continua a mesma.

## 6. Colar a URL no site

1. Abra `js/form-config.js`.
2. Troque o texto `COLE_AQUI_A_URL_DO_WEB_APP` pela URL que termina com `/exec`.
3. Deixe as aspas. Salve, suba o site e publique.

Enquanto esse texto não for trocado, o formulário avisa que o envio ainda não está ligado e não finge que enviou.

## 7. Testar

1. Abra `https://edsonmota.com/aplicar/`, preencha e envie.
2. Confira a aba `Aplicação` na planilha, o e-mail e um card novo no CRM, na etapa **Novo**.
3. Abra `https://edsonmota.com/inquietos/`, envie e confira a aba `INQUIETOS`. Esse envio não cria card no Notion. No fim, a pessoa vai para o Guia para Inquietos.

No CRM, a origem usa as opções que já existem: Instagram, Site/Typeform, Indicação, Anúncio, LinkedIn ou Outro. Google e Site entram como **Site/Typeform**, porque o CRM não tem uma opção chamada Google. A empresa e o mercado, que no formulário são um campo só, preenchem Empresa e Segmento.

## Se algo falhar

- Planilha vazia: confira se a implantação está como **Qualquer pessoa** e se a URL no site é a que termina com `/exec`.
- E-mail não chega: olhe o spam. O remetente é a conta Google que implantou o script.
- Card não aparece no Notion: confira se a integração foi convidada para o CRM · Leads e se o token e o ID estão nas propriedades. A planilha e o e-mail devem ter sido gravados mesmo assim.
