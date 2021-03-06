const sql = require('mssql')
const axios = require('axios')
var util = require('util')

function ArandaRequerimiento(builder) {
    //this.builder = builder


    this.dialogId = 'ArandaRequerimiento'

    this.dialog = [(session, args, next) => {


        const regex = /(?:\d{1,})/g
        let m;
        let codigos = new Array();
        //obtiene los grupos reconocidos según el regex
        while ((m = regex.exec(session.message.text)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++
            }
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                //console.log(`Found match, group ${groupIndex}: ${match}`)
                codigos.push(match)
            });
        }

        if (codigos.length === 0) {
            builder.Prompts.NumerosIncidentes(session, "¿Cuál es el requerimiento que quieres consultar? 🤔");

        }
        else {
            next({ response: codigos });
        }


    },
    (session, results, next) => {

        if (results === 'cancel')
        {
            session.endDialog('Cancelaste la consulta del requerimiento 😭.');
            session.beginDialog('MenuAyuda','MenuFinal')
        }
        else {
            var codigos = results.response;
            if (codigos.length > 1) {
                builder.Prompts.choice(session, "Me enviaste más de un número, ¿cuál quieres consultar? :O", codigos, { listStyle: builder.ListStyle.button });
                //builder.Prompts.choice(session, "Me enviaste más de un número, ¿quieres consultarlos todos? :O", "Sí|No", { listStyle: builder.ListStyle.button });
            }
            else {
                next({ response: codigos[0] })
            }
        }

    },
    (session, results, next) => {
        var codigo
        if (!util.isNullOrUndefined(results.response.entity))
            codigo = results.response.entity
        else
            codigo = results.response

        const url = process.env.DINBOT_API + `/Aranda/Requerimiento/${codigo}`;
        axios.get(url)
            .then(function (response) {
                if (response.status == 200) {
                    if(response.data){
                    var card = createHeroCard(session, codigo, response.data)

                    var reply = new builder.Message(session).addAttachment(card)
                    session.send('Esta la información del requerimiento:')
                    session.send(reply)
                    session.beginDialog('MenuAyuda','MenuFinal')
                    }
                    else{
                        session.send('No existe el requerimiento')  
                        session.beginDialog('MenuAyuda','MenuFinal')                      
                    }
                }
                else
                {
                    session.send('No obtuve información al consultar el requerimiento')
                    session.beginDialog('MenuAyuda','MenuFinal')
                }
            })
            .catch(function (error) {
                console.log(error);
                session.send('Tuve un error al consultar el requerimiento, intenta nuevamente más tarde')
                session.beginDialog('MenuAyuda','MenuFinal')

            });

        session.endDialog()



    }]

    function createHeroCard(session, idRequerimiento, objRequerimiento) {

        console.log(objRequerimiento)

        var Fecha_Creacion = 'Sin registro';
        if (!util.isNullOrUndefined(objRequerimiento.Fecha_Creacion)) {console.log()
            var _fecha_creacion = new Date(objRequerimiento.Fecha_Creacion)
            var dia = _fecha_creacion.getDate() < 10 ? `0${_fecha_creacion.getDate()}` : `${_fecha_creacion.getDate()}`
            var mes = _fecha_creacion.getMonth() < 10 ? `0${_fecha_creacion.getMonth()}` : `${_fecha_creacion.getMonth()}`
            var año = _fecha_creacion.getFullYear()
            Fecha_Creacion = `${dia}/${mes}/${año}`
        }
        var Fecha_Solucion_Proyectada = 'Sin registro';
        if (!util.isNullOrUndefined(objRequerimiento.Fecha_Solucion_Proyectada)) {
            var _fecha_solucion_proyectada = new Date(objRequerimiento.Fecha_Solucion_Proyectada)
            var dia = _fecha_solucion_proyectada.getDate() < 10 ? `0${_fecha_solucion_proyectada.getDate()}` : `${_fecha_solucion_proyectada.getDate()}`
            var mes = _fecha_solucion_proyectada.getMonth() < 10 ? `0${_fecha_solucion_proyectada.getMonth()}` : `${_fecha_solucion_proyectada.getMonth()}`
            var año = _fecha_solucion_proyectada.getFullYear()
            Fecha_Solucion_Proyectada = `${dia}/${mes}/${año}`
        }
        var Fecha_Solucion_Real = 'Sin registro';
        if (!util.isNullOrUndefined(objRequerimiento.Fecha_Solucion_Real)) {
            var _fecha_solucion_real = new Date(objRequerimiento.Fecha_Solucion_Real)
            var dia = _fecha_solucion_real.getDate() < 10 ? `0${_fecha_solucion_real.getDate()}` : `${_fecha_solucion_real.getDate()}`
            var mes = _fecha_solucion_real.getMonth() < 10 ? `0${_fecha_solucion_real.getMonth()}` : `${_fecha_solucion_real.getMonth()}`
            var año = _fecha_solucion_real.getFullYear()
            Fecha_Solucion_Real = `${dia}/${mes}/${año}`
        }


        var datosPersona = `**Codigo:** ${idRequerimiento}`
            + `\n\n **Categoria:** ${objRequerimiento.Categoria}`
            + `\n\n **Estado:** ${objRequerimiento.Estado}`
            + `\n\n **Autor:** ${objRequerimiento.Autor}`
            + `\n\n **Especialista:** ${objRequerimiento.Especialista}`
            + `\n\n **Fecha Creación:** ${Fecha_Creacion}`
            + `\n\n **Fecha Solución Proyectada:** ${Fecha_Solucion_Proyectada}`
            + `\n\n **Fecha Solución Real:** ${Fecha_Solucion_Real}`


        //console.log(datosPersona);
        return new builder.HeroCard(session)
            .title(`Requerimiento ${idRequerimiento}`)
            .text(datosPersona)
            .images([
                builder.CardImage.create(session, process.env.BANNER_GOB)
            ]);
    }

}

exports.ArandaRequerimiento = ArandaRequerimiento