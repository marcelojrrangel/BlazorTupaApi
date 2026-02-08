# JSON Tupa Manager

Gerenciador visual de arquivos JSON do repositório BlazorTupaApi com suporte a edição por formulário e JSON livre, validação automática, tratamento especial de imagens e datas, e deploy automático via GitHub Pages.

## 🚀 Características Principais

- **Login Seguro**: Autenticação via token GitHub pessoal (Classic PAT ou Fine-grained)
- **Edição Dual**: Formulário visual + Editor JSON com CodeMirror
- **Validação Automática**: Valida JSON contra schema inferido do arquivo original
- **Campos Especiais**:
  - **Logo**: Preview de imagens base64 com upload automático
  - **Tipo**: Dropdown com valores únicos do arquivo (Instagram, Whatsapp, etc)
  - **Data**: Calendário + hora com normalização automática ao salvar
  - **Descrição**: Textarea de 10 linhas para arquivos `pontos.json` e `preces.json`
- **Arrays Dinâmicos**: Adicionar/remover itens com placeholders automáticos
- **Deploy Automático**: Commit via GitHub API com disparo automático do GitHub Pages
- **Branch Automático**: Detecta automaticamente a branch padrão do repositório

## 📋 Requisitos

### Token GitHub

Crie um token pessoal com estas permissões:

**Classic PAT:**
- ✅ `repo` - Acesso completo a repositórios
- ✅ `workflow` - Controle de workflows (opcional, para deploy manual)

**Fine-grained PAT:**
- ✅ Repositório: `BlazorTupaApi`
- ✅ Permissões:
  - `Contents: Read and write`
  - `Actions: Read and write` (opcional)
  - `Metadata: Read`

## 🎯 Como Usar

### 1. Abrir a Aplicação
```
Abra: json-manager/login.html no seu navegador
```

### 2. Fazer Login
- Cole seu token GitHub no campo "Token do GitHub"
- Clique em "Salvar Token"
- O token fica armazenado no `localStorage` do navegador

⚠️ **Aviso de Segurança**: O token é armazenado no navegador. Use em ambiente confiável.

### 3. Listar Arquivos JSON
- Verifique os valores padrão:
  - Owner: `marcelojrrangel`
  - Repo: `BlazorTupaApi`
  - Pasta: `BlazorTupaApi/wwwroot/sample-data`
  - Branch: (auto-detectada)
- Clique em **"Listar JSONs"**
- Os arquivos disponíveis aparecem na sidebar

### 4. Editar Arquivos

#### Modo Formulário
1. Selecione um arquivo na sidebar
2. Preencha os campos no formulário visual
3. Para **arrays**, clique "Adicionar item" para novos registros
4. Use placeholders como guia de preenchimento

#### Modo JSON Livre
1. Clique na aba **"JSON Livre"**
2. Edite diretamente no editor CodeMirror
3. Use **"Formatar JSON"** para organizar o código

### 5. Salvar no GitHub
- Clique em **"Aplicar JSON"** para:
  1. ✅ Validar o JSON
  2. ✅ Aplicar mudanças no formulário
  3. ✅ Fazer commit no GitHub
  4. ✅ Disparar deploy automático (GitHub Pages)

- Status na barra inferior informa sucesso/erro

## 📊 Campos Especiais

### Campo: `logo`
- **Detecta**: Valores em base64 ou `data:image/`
- **Preview**: Exibe a imagem carregada
- **Upload**: Converter imagem para base64 automaticamente
- **Ações**: Remover imagem com um clique

Exemplo:
```json
{
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ..."
}
```

### Campo: `tipo`
- **Detecta**: Nome do campo = "tipo"
- **Dropdown**: Valores únicos encontrados no arquivo
- **Padrão**: Se não houver valores, oferece `Instagram` e `Whatsapp`
- **Fácil**: Evita erros de digitação

Exemplo:
```json
{
  "tipo": "Instagram"
}
```

### Campo: `data` (ou qualquer campo contendo "data")
- **Input**: `datetime-local` com calendário + hora
- **Normalização**: Ao salvar, converte para `YYYY-MM-DDTHH:mm:ss`
- **Novo Item**: Data e hora atuais pré-preenchidas

Exemplo:
```json
{
  "data": "2025-04-04T19:30:00"
}
```

### Campo: `descricao` (em `pontos.json` e `preces.json`)
- **Input**: Textarea de 10 linhas
- **Redimensionável**: Arraste a barra inferior
- **Multilinha**: Suporta quebras de linha

Exemplo:
```json
{
  "descricao": "Descrição\nde múltiplas\nlinhas"
}
```

## 🔄 Fluxo de Trabalho Completo

```
1. Login com Token GitHub
   ↓
2. Listar JSONs do repositório
   ↓
3. Selecionar arquivo
   ↓
4. Editar (Formulário ou JSON Livre)
   ↓
5. Clicar "Aplicar JSON"
   ├─ Valida JSON
   ├─ Normaliza datas
   ├─ Commit no GitHub
   └─ Deploy automático (GitHub Pages)
   ↓
6. Site BlazorTupaApi atualiza automaticamente
```

## 🛠️ Estrutura do Projeto

```
json-manager/
├── index.html              # Página principal
├── login.html              # Página de login
├── README.md               # Esta documentação
├── assets/
│   ├── css/
│   │   └── style.css       # Estilos do projeto
│   └── js/
│       ├── github.js       # API GitHub
│       └── app.js          # Lógica principal
```

## 📦 Tecnologias

- **Frontend**: HTML5 + CSS3 + JavaScript (ES6+)
- **Editor**: CodeMirror 5 (syntax highlighting)
- **API**: GitHub REST API v3
- **Styling**: Design limpo e responsivo

## 🐛 Troubleshooting

### Erro: "Token não encontrado"
- Faça login novamente em `login.html`
- Verifique se o token está válido

### Erro: "Resposta da API não é um array"
- Confirme o caminho do repositório
- Tente `BlazorTupaApi/wwwroot/sample-data` (com a pasta prefixada)

### Arquivo não carrega
- Verifique se o arquivo JSON é válido (sem BOM UTF-8)
- Revise a branch configurada
- Confirme as permissões do token

### Imagem não aparece no logo
- Verifique se é base64 válido ou `data:image/`
- Tente fazer upload novamente na interface

### Deploy não executa
- GitHub Pages é automático (não requer botão manual)
- Aguarde alguns minutos pela ação executar

## 📝 Exemplos de Uso

### Editar evento do calendário
1. Selecione `calendario.json`
2. Clique no formulário
3. Preencha `descricao`, `data` (com calendario), `detalhe`
4. Clique "Aplicar JSON"

### Adicionar novo Orixá
1. Selecione `orixas.json`
2. Clique "Adicionar item"
3. Preencha nome, descrição, etc
4. Faça upload da imagem no campo `logo`
5. Selecione `tipo` do dropdown
6. Clique "Aplicar JSON"

### Editar múltiplos registros
1. Selecione `pontos.json` ou `preces.json`
2. Edite cada campo com a textarea de 10 linhas
3. Adicione novos itens conforme necessário
4. Clique "Aplicar JSON" para salvar tudo

## 🔐 Segurança

- Token armazenado em `localStorage` (apenas cliente)
- Sem backend - comunicação direta com GitHub API
- Valide tokens periodicamente em GitHub Settings
- Revogue tokens antigos quando não mais necessários

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique o console do navegador (F12)
2. Confirme as permissões do token
3. Revise este documento
4. Acesse as logs do GitHub Actions para deploy

---

**Versão**: 1.0  
**Última atualização**: Fevereiro 2026  
**Autor**: GitHub Copilot
