const veiculoService = require("../services/veiculo.service");

class FipeMiddleware {
    getFipe(req, res, next) {
        let tipo = req.params.tipo;

        if (!(tipo in veiculoService.tipos)) {
            return res.status(400).json({ success: false, error: "Tipo inválido!" })
        }

        let placa = String(req.params.placa || "").trim()

        if (!placa) {
            return res.status(400).json({ success: false, error: "Placa inválida!" })
        }

        placa = placa.replace(/[\W_]+/g, "").toUpperCase()

        let regex = '[A-Z]{3}[0-9][0-9A-Z][0-9]{2}'

        if (!placa.match(regex)) {
            return res.status(400).json({ success: false, error: "Placa inválida!" })
        }

        next();
    }


    getPlaca(req, res, next) {
        let placa = String(req.params.placa || "").trim()

        if (!placa) {
            return res.status(400).json({ success: false, error: "Placa inválida!" })
        }

        placa = placa.replace(/[\W_]+/g, "").toUpperCase()

        let regex = '[A-Z]{3}[0-9][0-9A-Z][0-9]{2}'

        if (!placa.match(regex)) {
            return res.status(400).json({ success: false, error: "Placa inválida!" })
        }

        next();
    }
}

module.exports = new FipeMiddleware()