# API Consulta Placa

API em **Node.js** para consulta de informações veiculares a partir da placa.  
O sistema retorna dados como situação, marca, modelo, cor, ano, município, chassi e muito mais.

## 🚀 Tecnologias Utilizadas
- Node.js
- Express.js
- Integração com rede Tor (proxy de requisição)
- JSON como formato de resposta

## 📌 Endpoints

### 🔍 Consultar Placa
`GET /api/v1/placa/:placa`

**Exemplo de requisição:**
```

[http://localhost:3200/api/v1/placa/EJK2211](http://localhost:3200/api/v1/placa/EJK2211)

````

**Exemplo de resposta:**
```json
{
  "codigoSituacao": "0",
  "situacao": "Situação OK",
  "marca": "T",
  "modelo": "CHRYSLER GCARAVAN LTD",
  "cor": "Preta",
  "ano": "2003",
  "anoModelo": "2003",
  "placa": "EJK2211",
  "uf": "SP",
  "municipio": "São Paulo",
  "chassi": "58382",
  "data": "2021-07-07 20:22:25",
  "codigoRetorno": "0",
  "mensagemRetorno": "Sem erros"
}
````

## 🛠️ Como rodar o projeto

1. Clone o repositório:

```bash
git clone https://github.com/seuusuario/api-consulta-placa.git
cd api-consulta-placa
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o Tor (necessário para o proxy):

```bash
npm run tor:dev
```

4. Inicie o servidor:

```bash
npm run dev
```

5. Acesse:

```
http://localhost:3200/api/v1/placa/EJK2211
```