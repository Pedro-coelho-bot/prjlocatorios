/* API REST dos locatarios */
import express from 'express'
import { connectToDatabase } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'

const router = express.Router()
const {db, ObjectId} = await connectToDatabase()
const nomeCollection = 'locatarios'

import auth from '../middleware/auth.js'


const validalocatarios = [
    check('cpf')
    .not().isEmpty().trim().withMessage('É obrigatório informar o CPF')
    .isNumeric().withMessage('O CPF só deve conter números')
    .isLength({min: 9, max:12}).withMessage('O CPF deve conter entre 9 e 12 nºs'),
    check('nome')
    .not().isEmpty().trim().withMessage('É obrigatório informar o primeiro nome')
    .isAlphanumeric('pt-BR')
    .withMessage('O nome não deve ter caracteres especiais e/ou deve conter somente o primeiro nome')
    .isLength({min: 3}).withMessage('O nome é muito curta. Mínimo 3 caracteres')
    .isLength({max: 200}).withMessage('O nome é muito longo. Máximo 200'),
    check('idade')
    .isNumeric().withMessage('A idade deve ser um número'),
    check('data_nascimento').optional({nullable: true})
]

/**
 * GET
 * Lista todos os locatarios com alguel maior que
 */

router.get('/idade/:idade', async(req,res) => {
    try{
        db.collection(nomeCollection).find()
        .toArray((err, docs) => {

            if(err){

                res.status(400).json(err) // bad request

            } else {

                res.status(200).json(docs) // retorna o documento

            }

        })

    } catch (err) {

        res.status(500).json({"error": err.message})

    }

})

/**
 * GET /api/locatarios
 * Lista todos os locatarios
 */
router.get('/', async(req, res) => {
    try{
        db.collection(nomeCollection).find().sort({nome: 1}).toArray((err, docs) => {
            if(!err){
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        res.status(500).json({
            errors: [{
                value: `${err.message}`,
                msg: 'Erro ao obter a listagem dos locatarios',
                param: '/'
            }]
        })
    }
})

/**
 * GET /api/locatarios/id/:id
 * Lista todos os locatarios
 */
router.get('/id/:id', async(req, res)=> {
    try{
        db.collection(nomeCollection).find({'_id': {$eq: ObjectId(req.params.id)}})
        .toArray((err, docs) => {
            if(err){
                res.status(400).json(err) // bad request
            } else {
                res.status(200).json(docs) // retorna o documento
            }
        })
    } catch (err) {
        res.status(500).json({"error": err.message})
    }
})

router.get('/idade/:idade', async(req, res)=>{
    try{
        db.collection(nomeCollection).find({'_idade': {
            $or:[
                {idade:{$gt: 40}},
                {idade:{$lt: 60}}
            ]
        }}).toArray((err, docs)=> {
            if(err){
                res.status(400).json(err)
            }else{
                res.status(200).json(docs)
            }
        })
    }catch(err){
        res.status(500).json({"error": err.message})
    }
})


/**
 * GET /api/locatarios/nome/:nome
 * Lista os locatarios pelo nome
 */
router.get('/nome/:nome', async(req, res)=> {
    try{
        db.collection(nomeCollection)
        .find({'nome': {$regex: req.params.nome, $options: "i"}})
        .toArray((err, docs) => {
            if(err){
                res.status(400).json(err) // bad request
            } else {
                res.status(200).json(docs) // retorna o documento
            }
        })
    } catch (err) {
        res.status(500).json({"error": err.message})
    }
})



/**
 * DELETE /api/locatarios/:id
 * Apaga o locatarios de serviço pelo id
 */

router.delete('/:id', async(req, res) => {
    await db.collection(nomeCollection)
    .deleteOne({"_id": { $eq: ObjectId(req.params.id)}})
    .then(result => res.status(200).send(result))
    .catch(err => res.status(400).json(err))
})
/**
 * POST /api/locatarios
 * Insere um novo locatarios
 */
router.post('/', validalocatarios, async(req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        return res.status(400).json(({
            errors: errors.array()
        }))
    } else {
        await db.collection(nomeCollection)
        .insertOne(req.body)
        .then(result => res.status(200).send(result))
        .catch(err => res.status(400).json(err))
    }
})

/**
 * PUT /api/locatarios
 * Altera um locatarios de serviço
 */
router.put('/', validalocatarios, async(req, res) => {
    let idDocumento = req.body._id //armazenando o id do documento
    delete req.body._id //iremos remover o id do body
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        return res.status(400).json(({
            errors: errors.array()
        }))
    } else {
        await db.collection(nomeCollection)
        .updateOne({'_id': {$eq : ObjectId(idDocumento)}},
                   { $set: req.body})
        .then(result => res.status(200).send(result))
        .catch(err => res.status(400).json(err))
    }
})
export default router