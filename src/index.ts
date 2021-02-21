import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const cats = admin.firestore().collection("/cats/");

const readCat = async (request: functions.https.Request, response: functions.Response) => {
    try {
        if (!request.query.id) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Обязательно укажите ID кота!'
            );
        }
        const entity = await cats.doc(`${request.query.id}`).get();
        if (!entity.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Нет такого кота!'
            );
        } else {
            response.send(entity.data());
        }
    } catch (error) {
        throw new functions.https.HttpsError(
            'internal',
            `${error}`
        );
    };
}

const createCat = async (request: functions.https.Request, response: functions.Response) => {
    try {
        if (!request.body) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Обязательно укажите тело запроса!'
            );
        }
        const body = JSON.parse(request.body);
        if (!body['name'] || !body['color'] || !body['weight']) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Укажите все обязательные поля поля [name, color, weight]'
            );
        }
        const entity = await cats.add(body);
        response.send(`Создан кот с ID ${entity.id}`);
    } catch (error) {
        throw new functions.https.HttpsError(
            'internal',
            `${error}`
        );
    };
}

const updateCat = async (request: functions.https.Request, response: functions.Response) => {
    try {
        if (!request.query.id) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Обязательно укажите ID кота!'
            );
        }
        if (!request.body) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Обязательно укажите тело запроса!'
            );
        }
        const saved = await cats.doc(`${request.query.id}`).get();
        if (!saved.exists) {
            response.status(404).send('Нет такого кота!');
        } else {
            const body = JSON.parse(request.body);
            await cats.doc(`${request.query.id}`).update(body);
            response.send(`Кот с ID ${request.query.id} обновлен`);
        }
    } catch (error) {
        throw new functions.https.HttpsError(
            'internal',
            `${error}`
        );
    };
}

const deleteCat = async (request: functions.https.Request, response: functions.Response) => {
    try {
        if (!request.query.id) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Обязательно укажите ID кота!'
            );
        }
        const saved = await cats.doc(`${request.query.id}`).get();
        if (!saved.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Нет такого кота!'
            );
        } else {
            await cats.doc(`${request.query.id}`).delete();
            response.send(`Кот с ID ${request.query.id} удален`);
        }
    } catch (error) {
        throw new functions.https.HttpsError(
            'internal',
            `${error}`
        );
    };
}

export const cat = functions.https.onRequest(async (request, response) => {
    try {
        switch (request.method) {
            case "GET":
                await readCat(request, response);
                break;
            case "PUT":
                await createCat(request, response);
                break;
            case "POST":
                await updateCat(request, response);
                break;
            case "DELETE":
                await deleteCat(request, response);
                break;
            default:
                throw new functions.https.HttpsError(
                    'unavailable',
                    `${request.method} МЕТОД не определен`
                );
        }
    } catch (error) {
        response.status(error.httpErrorCode.status).send(JSON.stringify(error));
    }
});
