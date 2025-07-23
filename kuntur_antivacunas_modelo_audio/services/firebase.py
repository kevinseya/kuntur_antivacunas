import firebase_admin
from firebase_admin import credentials, db
 
# Inicializa Firebase solo una vez
cred = credentials.Certificate('util/firebase-config.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://appmineria-73303-default-rtdb.firebaseio.com/'
})
 
def write_real_database(data, path='signals/myId'):
    try:
        ref = db.reference(path)
        ref.set(data)
        print('✅ Data set in Firebase.')
        return True
    except Exception as error:
        print(f'❌ Error escribiendo en Firebase: {error}')
        return False