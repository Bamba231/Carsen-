let idVoitureModification = null;
let imagesPourModification = null;
let modeHorsLigne = false;
let voituresLocales = [];

document.getElementById('formulaire-connexion-admin').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('id-connexion').value;
    const pw = document.getElementById('mdp-connexion').value;
    if (id === 'carsen' && pw === 'Modou2000') {
        document.getElementById('portail-logique').style.opacity = '0';
        setTimeout(() => document.getElementById('portail-logique').style.display = 'none', 300);
        chargerVoitures();
    } else {
        afficherNotification("Identifiants incorrects", true);
    }
});

function deconnexion() {
    window.location.reload();
}

function changerVue(viewId) {
    document.querySelectorAll('.section-vue').forEach(v => v.classList.remove('actif'));
    document.getElementById(viewId).classList.add('actif');

    document.querySelectorAll('.element-navigation').forEach(n => n.classList.remove('actif'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('actif');
    }

    if (viewId === 'vue-ajouter') {
        if (!idVoitureModification) {
            document.getElementById('titre-formulaire').innerText = "Créer une Annonce";
            document.getElementById('btn-soumettre-voiture').innerHTML = '<i class="fas fa-paper-plane"></i> Publier l\'Annonce';
            document.getElementById('formulaire-voiture').reset();
            document.getElementById('apercu-telechargement').innerHTML = '';
        }
    } else {
        idVoitureModification = null;
    }
}

function afficherNotification(msg, isError = false) {
    const toast = document.getElementById('notification-toast');
    document.getElementById('message-toast').innerText = msg;
    toast.style.background = isError ? '#e74c3c' : '#2ecc71';
    toast.classList.add('afficher');
    setTimeout(() => toast.classList.remove('afficher'), 3000);
}

async function chargerVoitures() {
    try {
        const res = await fetch('/api/cars');
        if (!res.ok) throw new Error("API FAILED");
        voituresLocales = await res.json();
        modeHorsLigne = false;
    } catch (e) {
        modeHorsLigne = true;
        afficherNotification("Hors-ligne (API indisponible)", true);
        const saved = localStorage.getItem('carsen_data');
        if (saved) {
            try { voituresLocales = JSON.parse(saved); } catch (err) { }
        } else if (window.cars) {
            voituresLocales = window.cars;
        }
    }

    const grid = document.getElementById('grille-voitures');
    grid.innerHTML = voituresLocales.slice().reverse().map(voiture => `
        <div class="carte-voiture-admin">
            <img src="${voiture.images && voiture.images[0] ? voiture.images[0] : ''}" class="img-voiture-admin" alt="Voiture">
            <div class="info-voiture-admin">
                <div class="titre-voiture-admin">
                    <span>${voiture.make} ${voiture.model}</span>
                    <span style="color:var(--text-muted); font-size:0.9rem;">${voiture.year}</span>
                </div>
                <div class="prix-voiture-admin">${voiture.price.toLocaleString()} FCFA</div>
                <div class="actions-voiture-admin">
                    <button class="bouton-icone bouton-modifier" onclick="modifierVoiture(${voiture.id})"><i class="fas fa-pen"></i> Modifier</button>
                    <button class="bouton-icone bouton-supprimer" onclick="supprimerVoiture(${voiture.id})"><i class="fas fa-trash"></i> Supprimer</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function supprimerVoiture(id) {
    if (confirm('Supprimer cette annonce ? Les utilisateurs ne la verront plus.')) {
        if (!modeHorsLigne) {
            try {
                await fetch('/api/cars/' + id, { method: 'DELETE' });
                afficherNotification("Annonce supprimée");
                chargerVoitures();
            } catch (e) { afficherNotification("Erreur API", true); }
        } else {
            voituresLocales = voituresLocales.filter(c => c.id !== id);
            localStorage.setItem('carsen_data', JSON.stringify(voituresLocales));
            afficherNotification("Supprimé (hors-ligne)");
            chargerVoitures();
        }
    }
}

async function modifierVoiture(id) {
    const voiture = voituresLocales.find(c => c.id === id);
    if (!voiture) return;

    idVoitureModification = id;
    imagesPourModification = voiture.images;

    if (!modeHorsLigne) {
        try {
            document.getElementById('btn-soumettre-voiture').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
            document.getElementById('btn-soumettre-voiture').disabled = true;
            const res = await fetch(`/api/cars/${id}`);
            if (res.ok) {
                const fullCar = await res.json();
                imagesPourModification = fullCar.images;
            }
            document.getElementById('btn-soumettre-voiture').disabled = false;
        } catch (e) { }
    }

    document.getElementById('voiture-marque').value = voiture.make;
    document.getElementById('voiture-modele').value = voiture.model;
    document.getElementById('voiture-annee').value = voiture.year;
    document.getElementById('prix-voiture-admin').value = voiture.price;

    document.getElementById('voiture-moteur').value = voiture.specs?.moteur || '';
    document.getElementById('voiture-km').value = voiture.specs?.kilométrage || '';
    document.getElementById('voiture-trans').value = voiture.specs?.transmission || 'Automatique';
    document.getElementById('voiture-carburant').value = voiture.specs?.carburant || 'Essence';

    document.getElementById('titre-formulaire').innerText = "Modifier l'Annonce";
    document.getElementById('btn-soumettre-voiture').innerHTML = '<i class="fas fa-save"></i> Enregistrer les modifs';
    document.getElementById('apercu-telechargement').innerHTML = '';

    document.querySelectorAll('.section-vue').forEach(v => v.classList.remove('actif'));
    document.getElementById('vue-ajouter').classList.add('actif');
    document.querySelectorAll('.element-navigation').forEach(n => n.classList.remove('actif'));
    const items = document.querySelectorAll('.element-navigation');
    if (items.length > 2) items[2].classList.add('actif');
}

const fileInput = document.getElementById('voiture-images');
fileInput.addEventListener('change', (e) => {
    const preview = document.getElementById('apercu-telechargement');
    preview.innerHTML = '';
    Array.from(e.target.files).forEach(f => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(f);
        img.style.height = '60px';
        img.style.borderRadius = '5px';
        preview.appendChild(img);
    });
});

const traiterImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxW = 800;
                let w = img.width, h = img.height;
                if (w > maxW) { h *= maxW / w; w = maxW; }
                canvas.width = w; canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
        };
    });
};

document.getElementById('formulaire-voiture').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-soumettre-voiture');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
    btn.disabled = true;

    try {
        let b64Images = [];
        if (fileInput.files.length > 0) {
            b64Images = await Promise.all(Array.from(fileInput.files).map(traiterImage));
        }

        if (!idVoitureModification && b64Images.length === 0) {
            afficherNotification("Ajoutez au moins 1 photo", true);
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier l\'Annonce';
            btn.disabled = false;
            return;
        }

        const payload = {
            make: document.getElementById('voiture-marque').value,
            model: document.getElementById('voiture-modele').value,
            year: parseInt(document.getElementById('voiture-annee').value),
            price: parseInt(document.getElementById('prix-voiture-admin').value),
            specs: {
                moteur: document.getElementById('voiture-moteur').value,
                kilométrage: document.getElementById('voiture-km').value,
                transmission: document.getElementById('voiture-trans').value,
                carburant: document.getElementById('voiture-carburant').value
            }
        };

        if (idVoitureModification) {
            if (b64Images.length > 0) {
                payload.images = b64Images;
            } else {
                payload.images = imagesPourModification;
            }
        } else {
            payload.images = b64Images;
        }

        if (!modeHorsLigne) {
            let res;
            if (idVoitureModification) {
                res = await fetch('/api/cars/' + idVoitureModification, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/cars', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                afficherNotification(idVoitureModification ? "Annonce modifiée" : "Annonce publiée");
                document.getElementById('formulaire-voiture').reset();
                document.getElementById('apercu-telechargement').innerHTML = '';
                idVoitureModification = null;
                changerVue('vue-liste');
                chargerVoitures();
            }
        } else {
            if (idVoitureModification) {
                const idx = voituresLocales.findIndex(c => c.id === idVoitureModification);
                if (idx !== -1) voituresLocales[idx] = { ...voituresLocales[idx], ...payload, id: idVoitureModification };
            } else {
                const maxId = voituresLocales.length > 0 ? Math.max(...voituresLocales.map(c => c.id)) : 0;
                payload.id = maxId + 1;
                voituresLocales.push({ ...payload });
            }
            localStorage.setItem('carsen_data', JSON.stringify(voituresLocales));
            afficherNotification("Sauvegardé (hors-ligne)");

            document.getElementById('formulaire-voiture').reset();
            document.getElementById('apercu-telechargement').innerHTML = '';
            idVoitureModification = null;
            changerVue('vue-liste');
            chargerVoitures();
        }

    } catch (err) {
        afficherNotification("Erreur inconnue", true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = idVoitureModification ? '<i class="fas fa-save"></i> Enregistrer les modifs' : '<i class="fas fa-paper-plane"></i> Publier l\'Annonce';
    }
});
