require("dotenv").config()
const cron = require('node-cron');
const UserAgents = require("user-agents");
const querystring = require("querystring");

const axios = require("../config/axios")

const torService = require("./tor.service");

const logger = require("../logger");
const { httpsGet, httpsPost } = require("../utils/requests");
const { delay } = require("../utils/promiseAllSettled");
const stringSimilarity = require("string-similarity");
const { encontrarMarcaCorreta, encontrarModelosCorretos } = require("./chatgpt.service");

class VeiculoService {
    proxyURL = process.env.PROXYURL
    userAgent = this.getUserAgent()

    tipos = {
        "carros": 1,
        "motos": 2,
        "caminhoes": 3
    }

    constructor() {
        this.fingerprint()
    }

    async getFIPE(placa, tipo = "carros") { //carros,motos,caminhoes
        try {
            const veiculo = await this.getVeiculo(placa);

            if (!veiculo) {
                return null;
            }

            const marcas = await this.getMarcas(tipo)

            let marca = await encontrarMarcaCorreta(veiculo, marcas) /* (marcas || []).find(({ nome }) => {
                let nomeMarca = nome.toLowerCase();
                let modelo = veiculo.modelo.toLowerCase();
                let marcaVeiculo = veiculo.marca.toLowerCase();

                // Verifica se o modelo contém o nome da marca
                if (modelo.includes(nomeMarca)) {
                    return true;
                }

                // Verifica se a marca do veículo coincide com o nome da marca
                if (marcaVeiculo === nomeMarca || nomeMarca.includes(marcaVeiculo)) {
                    return true;
                }

                // Verifica se o início do modelo coincide com a marca
                let keyModelo = modelo.split(" ")[0]; // Pega a primeira palavra do modelo
                if (keyModelo === nomeMarca || nomeMarca.includes(keyModelo)) {
                    return true;
                }

                return false;
            }); */

            if (!marca) {
                return null;
            }


            const { codigo: codigoMarca, nome: nomeMarca } = marca;


            const modelosPorAno = await this.getModelosMarcaEano(codigoMarca, veiculo.anoModelo, this.tipos[tipo]);

            let possiveisModelos = await encontrarModelosCorretos(veiculo, modelosPorAno)/* (modelosPorAno || []).filter(({ nome: nomeModelo }) => {
                let keywords = veiculo.modelo.split(" ")

                return keywords.filter(k => nomeModelo.toLowerCase().indexOf(k.toLowerCase()) != -1).length == keywords.length
            }) */

            /* 
                        let modelos = []
            
                        for (let modelo of possiveisModelos) {
                            try {
                                const nomeModelo = modelo.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
            
                                let anoModelo = `${veiculo.anoModelo}-1`
            
                                //Elétrico = 1
                                if (
                                    nomeModelo.includes("diesel") ||
                                    nomeModelo.includes("dies.") ||
                                    nomeModelo.includes("die.")
                                ) {
                                    anoModelo = `${veiculo.anoModelo}-3`
                                } else if (
                                    nomeModelo.includes("flex") ||
                                    nomeModelo.includes("gaso.") ||
                                    nomeModelo.includes("gas.") ||
                                    nomeModelo.includes("gasolina") ||
                                    nomeModelo.includes("gas")
                                ) {
                                    anoModelo = `${veiculo.anoModelo}-1`
                                } else if (nomeModelo.includes("flex") ||
                                    nomeModelo.includes("alcool") ||
                                    nomeModelo.includes("etanol") ||
                                    nomeModelo.includes("alco.") ||
                                    nomeModelo.includes("al.") ||
                                    nomeModelo.includes("etan.") ||
                                    nomeModelo.includes("eta.") ||
                                    nomeModelo.includes("et.")) {
                                    anoModelo = `${veiculo.anoModelo}-2`
                                }
            
                                let preco = null;
            
                                for (let i = 0; i <= 3; i++) {
                                    preco = await this.getPreco(codigoMarca, modelo.codigo, i || anoModelo, tipo)
            
                                    if (preco)
                                        break;
                                    else
                                        continue;
                                }
            
                                modelo = {
                                    ...modelo,
                                    preco
                                }
            
                                modelos.push(modelo)
                            } catch (error) {
                                logger.error(error)
                            }
                        } */

            return {
                anoModelo: veiculo.anoModelo,
                veiculo,
                marca,
                modelos: possiveisModelos
            }
        } catch (error) {
            logger.error(error.message)
            throw error
        }
    }


    async getVeiculo(placa, trying = 0) {
        try {
            const { data: plainData, statusCode } = await httpsGet(`https://placafipeapi.com.br/drveiculo/${placa}/ZX063-BBQ782-kmziW7D-MUi5x7Ba_Vh2u3`, {
                "Accept-Encoding": "gzip",
                "Connection": "Keep-Alive",
                "Host": "placafipeapi.com.br",
                "User-Agent": this.userAgent
            }, this.proxyURL)

            if ((statusCode != 200 && statusCode != 400) && trying < 1) {
                return this.getVeiculo(placa, trying + 1);
            } else if (statusCode == 400) {
                return null
            } else if (statusCode != 200) {
                throw new Error(`Requisição com status ${statusCode}! Mais de ${trying} tentativas`)
            }

            const veiculo = JSON.parse(plainData);

            return veiculo
        } catch (error) {
            logger.info(error)
        }
    }

    encontrarMarcaPorSemelhanca(veiculo, marcas) {
        const modelo = veiculo.modelo.toLowerCase();
        const marcaInformada = veiculo.marca.toLowerCase();

        // Calcular similaridade para todas as marcas
        const resultados = marcas.map(({ nome, codigo }) => {
            const nomeLower = nome.toLowerCase();

            // Pontuação baseada na semelhança do modelo
            const scoreModelo = stringSimilarity.compareTwoStrings(nomeLower, modelo);
            // Pontuação baseada na semelhança da marca
            const scoreMarca = stringSimilarity.compareTwoStrings(nomeLower, marcaInformada);

            return {
                nome,
                codigo,
                score: Math.max(scoreModelo, scoreMarca) // Pega o maior entre as duas semelhanças
            };
        });

        // Ordenar por maior similaridade
        resultados.sort((a, b) => b.score - a.score);

        // Retornar a marca com maior similaridade
        return resultados[0].score > 0.2 ? resultados[0].nome : null; // Limite de confiança
    }


    async getPreco(codigoMarca, codigoModelo, codigoVersao, codigoTipoVeiculo = "carros") { //carros,motos,caminhoes
        try {
            const { data } = await axios.get(`https://parallelum.com.br/fipe/api/v1/${codigoTipoVeiculo}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos/${codigoVersao}`)

            return data
        } catch (error) {
            logger.info(error)
            return null
        }
    }

    async getModeloAnos(codigoMarca, codigoModelo, codigoTipoVeiculo = "carros") { //carros,motos,caminhoes
        try {
            const { data } = await axios.get(`https://parallelum.com.br/fipe/api/v1/${codigoTipoVeiculo}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos`)

            return data
        } catch (error) {
            logger.error(error)
        }
    }

    // Retorna as versões para um modelo de veiculo de um determinado ano
    async getVersions(codigoMarca, codigoModelo, anoModelo, codigoTipoVeiculo = "carros") { //carros,motos,caminhoes
        try {
            let modeloAnos = await this.getModeloAnos(codigoMarca, codigoModelo, codigoTipoVeiculo)


            modeloAnos = modeloAnos.map(({ nome, codigo }) => {
                let [ano, combustivel] = codigo.split("-")

                return { ano, combustivel, combustivelNome: combustivel == 1 ? "Gasolina/Flex" : "Outro", codigo }
            })

            modeloAnos = modeloAnos
                .filter(({ ano }) => ano == anoModelo)
                .map(({ combustivel, combustivelNome, codigo }) => ({ combustivel, combustivelNome, codigo }))

            return modeloAnos
        } catch (error) {
            logger.error(error.message);
        }
    }


    async getTabelaReferencia() {
        try {
            const { data: [{ Codigo: codigoTabelaReferencia }] } = await axios.post("https://veiculos.fipe.org.br/api/veiculos/ConsultarTabelaDeReferencia")

            return codigoTabelaReferencia
        } catch (error) {
            logger.info(error)
        }
    }

    async getModelosMarcaEano(codigoMarca, anoModelo, codigoTipoVeiculo = 1) {
        try {
            const codigoTabelaReferencia = await this.getTabelaReferencia()

            const { data } = await axios.post("https://veiculos.fipe.org.br/api/veiculos/ConsultarModelosAtravesDoAno", querystring.encode({
                codigoTipoVeiculo,
                "modeloCodigoExterno": "",
                codigoTabelaReferencia,
                codigoMarca,
                "tipoConsulta": "Tradicional",
                "codigoModelo": "",
                "anoModelo": anoModelo
            }), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                }
            })

            return data.map(({ Label: nome, Value: codigo }) => ({ nome, codigo }))
        } catch (error) {
            logger.info(error)
        }
    }


    async getMarcas(tipo = "carros") { //carros,motos,caminhoes
        try {
            const { data } = await axios.get("https://parallelum.com.br/fipe/api/v1/" + tipo + "/marcas")

            return data
        } catch (error) {
            logger.info(error)
        }
    }

    fingerprint() {
        setInterval(async () => {
            try {
                await torService.changeIP()

                this.userAgent = this.getUserAgent()
            } catch (error) {
                logger.error(`Erro ao trocar IP: ${error.message}`)
            }
        }, 30000);
    }

    getUserAgent() {
        return new UserAgents({ deviceCategory: 'mobile' }).toString()
    }
}

module.exports = new VeiculoService()