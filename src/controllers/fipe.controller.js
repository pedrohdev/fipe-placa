const redis = require("../config/redis");
const moment = require("../config/moment")
const FIPE = require("../services/veiculo.service")

class FipeController {
    async getPlaca(req, res) {
        try {

            const placa = String(req.params.placa).toUpperCase().replace(/[\W_]+/g, "")

            const keyRedis = `fipe_placa:placa:${placa}`
            const dbRedis = await redis.get(keyRedis)

            /*  if (dbRedis) {
                 return res.status(200).json(JSON.parse(dbRedis))
             } */

            const placaRes = await FIPE.getVeiculo(placa);

            if (!placaRes) {
                return res.status(404).json({ success: false, message: "Placa não encontrada!" })
            }

            await redis.set(keyRedis, JSON.stringify(placaRes))

            res.status(200).json(placaRes)
        } catch (error) {
            res.status(500).json({ success: false, error: error.message })
        }
    }

    async getFipe(req, res) {
        try {

            const placa = String(req.params.placa).toUpperCase().replace(/[\W_]+/g, "")

            const keyRedis = `fipe:placa:${placa}`
            const dbRedis = await redis.get(keyRedis)

            if (dbRedis) {
                return res.status(200).json(JSON.parse(dbRedis))
            }


            const fipeResult = await FIPE.getFIPE(placa, req.params.tipo);

            if (!fipeResult) {
                return res.status(404).json({ success: false, message: "Placa não encontrada!" })
            }

            await redis.set(keyRedis, JSON.stringify(fipeResult))

            res.status(200).json(fipeResult)
        } catch (error) {
            res.status(500).json({ success: false, error: error.message })
        }
    }

    async getPreco(req, res) {
        try {
            const { tipo, marca, modelo, combustivel, ano } = req.params


            const keyRedis = `fipe:preco-modelo:${tipo}:${marca}:${modelo}:${ano}-${combustivel}`
            const dbRedis = await redis.get(keyRedis)

            if (dbRedis) {
                return res.status(200).json(JSON.parse(dbRedis))
            }

            const fipeResult = await FIPE.getPreco(marca, modelo, `${ano}-${combustivel}`, tipo);

            if (!fipeResult) {
                return res.status(404).json({ success: false, message: "Modelo não encontrado!" })
            }

            await redis.set(keyRedis, JSON.stringify(fipeResult), "EX", moment().add(1, 'month').startOf('month').diff(moment(), 'seconds'))

            res.status(200).json(fipeResult)
        } catch (error) {
            res.status(500).json({ success: false, error: error.message })
        }
    }
}

module.exports = new FipeController()