require("dotenv").config()

const axios = require('axios');

const API_KEY = process.env.OPENAI_KEY;
const url = 'https://api.openai.com/v1/chat/completions';

async function encontrarMarcaCorreta(veiculo, marcas) {
    const promptBase = `
Você é um sistema que ajuda a encontrar a marca correta de um veículo com base em seu modelo e/ou marca. 
Aqui estão as regras:
1. Priorize a marca exatamente igual ao nome indicado no campo "marca" do veículo.
2. Se o modelo do veículo começar com o nome da marca, escolha essa marca.
3. Se nenhuma correspondência exata for encontrada, escolha a marca cujo nome esteja contido no modelo do veículo.

Aqui está o veículo:
${JSON.stringify(veiculo)}

E aqui está a lista de marcas:
${JSON.stringify(marcas)}

Retorne apenas o ID (codigo) da marca correta, sem explicações adicionais. Se não houver correspondência, retorne "null".
`;

    const chamarAPI = async (tentativa) => {
        try {
            const response = await axios.post(
                url,
                {
                    model: process.env.OPENAI_MODEL,
                    messages: [
                        { role: "system", content: "Você é um assistente útil." },
                        { role: "user", content: promptBase }
                    ],
                    temperature: 0.2 // Menor valor para respostas mais determinísticas
                },
                {
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const codigo = response.data.choices[0].message.content.trim();

            // Buscar a marca correta pelo código
            const marcaEncontrada = marcas.find(marca => marca.codigo === codigo);
            if (marcaEncontrada) {
                return marcaEncontrada; // Retorna a marca correta
            } else {
                console.warn(`Tentativa ${tentativa}: Código inválido ou marca não encontrada:`, codigo);
            }
        } catch (error) {
            console.error(`Erro ao chamar a API na tentativa ${tentativa}:`, error.response?.data || error.message);
        }
        return null; // Retorna null se a API não funcionar corretamente
    };

    // Tentar encontrar a marca até 3 vezes
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
        const resultado = await chamarAPI(tentativa);
        if (resultado) {
            return resultado; // Retorna assim que encontrar a marca correta
        }
    }

    return null; // Retorna null se todas as tentativas falharem
}


async function encontrarModelosCorretos(veiculo, modelos) {
    const promptBase = `
Você é um sistema que ajuda a encontrar os modelos corretos de um veículo com base em seu nome. 
Aqui estão as regras:
1. Priorize a correspondência exata entre o modelo do veículo e o nome do modelo na lista.
2. Se o modelo do veículo contiver uma parte significativa do nome do modelo, escolha esse modelo.
3. Caso haja mais de um modelo que corresponda ao veículo, retorne todos os IDs (Value) desses modelos.

Aqui está o veículo:
${JSON.stringify(veiculo)}

E aqui estão os modelos disponíveis:
${JSON.stringify(modelos)}

Retorne apenas os IDs (Value) dos modelos corretos, separados por vírgula. Se não houver correspondência, retorne "null".
`;

    const chamarAPI = async (tentativa) => {
        try {
            const response = await axios.post(
                url,
                {
                    model: process.env.OPENAI_MODEL,
                    messages: [
                        { role: "system", content: "Você é um assistente útil." },
                        { role: "user", content: promptBase }
                    ],
                    temperature: 0.2 // Menor valor para respostas mais determinísticas
                },
                {
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const valores = response.data.choices[0].message.content.trim();

            // Se não houver correspondência, retornamos null
            if (valores === "null") {
                return null;
            }

            // Dividir os valores retornados pelo ChatGPT (IDs dos modelos)
            const idsModelos = valores.split(',').map(id => id.trim());

            // Buscar os modelos correspondentes pelos IDs
            const modelosCorretos = modelos.filter(modelo => idsModelos.includes(modelo.codigo.toString()));

            if (modelosCorretos.length > 0) {
                return modelosCorretos; // Retorna os modelos encontrados
            } else {
                console.warn(`Tentativa ${tentativa}: Nenhum modelo encontrado com os IDs:`, valores);
            }
        } catch (error) {
            console.error(`Erro ao chamar a API na tentativa ${tentativa}:`, error.response?.data || error.message);
        }
        return null; // Retorna null se a API não funcionar corretamente
    };

    // Tentar encontrar os modelos até 3 vezes
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
        const resultado = await chamarAPI(tentativa);
        if (resultado) {
            return resultado; // Retorna assim que encontrar os modelos corretos
        }
    }

    return null; // Retorna null se todas as tentativas falharem
}


module.exports = { encontrarMarcaCorreta, encontrarModelosCorretos };
