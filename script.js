let voitures = window.cars || [];


window.chargerDonneesVoitures = async function () {
    try {
        const response = await fetch('/api/cars');
        if (response.ok) {
            voitures = await response.json();
        } else {
            throw new Error("Serveur non accessible");
        }
    } catch (e) {
        const donneesLocales = localStorage.getItem('carsen_data');
        if (donneesLocales) {
            try {
                voitures = JSON.parse(donneesLocales);
            } catch (err) {
                console.error("Erreur localStorage", err);
            }
        }
    }
    if (typeof afficherCatalogue === 'function') {
        afficherCatalogue();
    }
};

window.afficherCatalogue = function () {
    const grilleCAtalogue = document.getElementById('grille-catalogue');
    if (!grilleCAtalogue) {
        return;
    }

    grilleCAtalogue.innerHTML = voitures.map(voiture => `
        <div class="carte-voiture apparition-defilement" data-id="${voiture.id}">
            <div class="conteneur-image-voiture">
                <img src="${voiture.images[0]}" alt="${voiture.make} ${voiture.model}" class="image-voiture" id="img-${voiture.id}" data-index="0">
            </div>

            <div class="info-voiture-light">
                <h3 class="titre-voiture-light">${voiture.make} ${voiture.model} ${voiture.year || '2020'}</h3>
                
                <div class="prix-light">${voiture.price.toLocaleString()} FCFA</div>
                
                <hr class="separateur-carte">
                
                <div class="grille-specs-light">
                    <div class="spec-item-light">
                        <i class="fas fa-cog"></i>
                        <span>${voiture.specs?.transmission || 'Automatique'}</span>
                    </div>
                    <div class="spec-item-light">
                        <i class="fas fa-gas-pump"></i>
                        <span>${voiture.specs?.carburant || 'Essence'}</span>
                    </div>
                    <div class="spec-item-light">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>${voiture.specs?.kilométrage || '50k km'}</span>
                    </div>
                </div>

                <hr class="separateur-carte">

                <div class="footer-light">
                    <div class="info-assurance certifie">
                        <i class="fas fa-check-circle"></i> Certifiée
                    </div>
                    <div class="info-assurance inspecte">
                        <i class="fas fa-search"></i> Inspectée
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.carte-voiture').forEach(carte => {
        carte.addEventListener('click', (e) => {
            if (e.target.closest('.btn-carousel')) return;

            const idVoiture = parseInt(carte.dataset.id);
            ouvrirVueDetail(idVoiture);
        });
    });

    if (window.initScrollAnimations) window.initScrollAnimations();
};

window.initScrollAnimations = function () {
    // Les éléments sont maintenant toujours visibles (animations supprimées)
};

document.addEventListener('DOMContentLoaded', () => {

    if (window.initScrollAnimations) {
        // Animations retirées car causant des saccades sur la vue mobile
        const elements = document.querySelectorAll('.apparition-defilement, .animation-zoom-doux, .animation-balayage-droite, .animation-balayage-gauche');
        elements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    const btnOuvrirRecherche = document.getElementById('btn-ouvrir-recherche');
    const modalRecherche = document.getElementById('overlay-recherche-modal');
    const btnFermerRecherche = document.getElementById('btn-fermer-recherche');
    const inputRechercheActif = document.getElementById('champ-recherche-actif');
    const grilleResultats = document.getElementById('grille-resultats-recherche');
    const etatVide = document.getElementById('etat-vide-recherche');
    const btnContactVide = document.getElementById('btn-contact-recherche-vide');

    if (btnOuvrirRecherche && modalRecherche) {
        btnOuvrirRecherche.addEventListener('click', () => {
            modalRecherche.classList.add('actif');
            document.body.classList.add('sans-defilement');
            setTimeout(() => {
                inputRechercheActif.focus();
            }, 100);
        });

        const fermerModalRecherche = () => {
            modalRecherche.classList.remove('actif');
            document.body.classList.remove('sans-defilement');
            inputRechercheActif.value = '';
            grilleResultats.innerHTML = '';
            grilleResultats.classList.remove('actif');
            etatVide.style.display = 'none';
        };

        btnFermerRecherche.addEventListener('click', fermerModalRecherche);

        btnContactVide.addEventListener('click', () => {
            fermerModalRecherche();
        });

        // Fermer en cliquant en dehors du conteneur interne
        modalRecherche.addEventListener('click', (e) => {
            if (e.target === modalRecherche) {
                fermerModalRecherche();
            }
        });

        inputRechercheActif.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();

            if (term.length === 0) {
                grilleResultats.innerHTML = '';
                grilleResultats.classList.remove('active');
                etatVide.style.display = 'none';
                return;
            }

            const vehiculesFiltres = voitures.filter(voiture => {
                const searchString = `${voiture.make} ${voiture.model} ${voiture.year}`.toLowerCase();
                return searchString.includes(term);
            });

            if (vehiculesFiltres.length > 0) {
                etatVide.style.display = 'none';
                grilleResultats.innerHTML = vehiculesFiltres.map(voiture => `
                    <div class="carte-voiture apparition-defilement est-visible" data-id="${voiture.id}" onclick="ouvrirVueDetail(${voiture.id}); document.getElementById('overlay-recherche-modal').classList.remove('actif'); document.body.classList.remove('sans-defilement');">
                        <div class="conteneur-image-voiture">
                            <img src="${voiture.images[0]}" alt="${voiture.make} ${voiture.model}" class="image-voiture" id="search-img-${voiture.id}" data-index="0">
                        </div>
                        <div class="info-voiture-light">
                            <h3 class="titre-voiture-light">${voiture.make} ${voiture.model} ${voiture.year || '2020'}</h3>
                            <div class="prix-light">${voiture.price.toLocaleString()} FCFA</div>
                            <hr class="separateur-carte">
                            <button class="bouton-devis" style="width: 100%; text-align: center; margin-top: 10px;">Voir</button>
                        </div>
                    </div>
                `).join('');
                grilleResultats.classList.add('actif');
            } else {
                grilleResultats.innerHTML = '';
                grilleResultats.classList.remove('actif');
                etatVide.style.display = 'flex';
            }
        });
    }
});

window.changerImage = function (idVoiture, direction) {
    const voiture = voitures.find(v => v.id === idVoiture);
    if (!voiture) return;

    const imgElement = document.getElementById(`img-${idVoiture}`);
    let indexActuel = parseInt(imgElement.dataset.index);

    indexActuel += direction;

    if (indexActuel < 0) indexActuel = voiture.images.length - 1;
    if (indexActuel >= voiture.images.length) indexActuel = 0;

    imgElement.src = voiture.images[indexActuel];
    imgElement.dataset.index = indexActuel;
};

window.ouvrirVueDetail = function (id) {
    const voiture = voitures.find(v => v.id === id);
    if (!voiture) return;

    const imgDetailHero = document.getElementById('img-detail-hero');
    const titreDetail = document.getElementById('titre-detail');
    const prixDetail = document.getElementById('prix-detail');
    const prixAction = document.getElementById('prix-action');
    const moteurDetail = document.getElementById('moteur-detail');
    const kilométrageDetail = document.getElementById('kilométrage-detail');
    const transmissionDetail = document.getElementById('transmission-detail');
    const carburantDetail = document.getElementById('carburant-detail');
    const galerieDetail = document.getElementById('galerie-detail');
    const lienWhatsappDetail = document.getElementById('lien-whatsapp-detail');
    const vueDetail = document.getElementById('vue-detail');

    if (imgDetailHero) imgDetailHero.src = voiture.images[0];
    if (titreDetail) titreDetail.textContent = `${voiture.make} ${voiture.model} (${voiture.year})`;
    if (prixDetail) prixDetail.textContent = `${voiture.price.toLocaleString()} FCFA`;
    if (prixAction) prixAction.textContent = `${voiture.price.toLocaleString()} FCFA`;

    if (moteurDetail) moteurDetail.textContent = voiture.specs?.moteur || 'Non spécifié';
    if (kilométrageDetail) kilométrageDetail.textContent = voiture.specs?.kilométrage || '50k km';
    if (transmissionDetail) transmissionDetail.textContent = voiture.specs?.transmission || 'Non spécifié';
    if (carburantDetail) carburantDetail.textContent = voiture.specs?.carburant || 'Non spécifié';

    if (galerieDetail) {
        galerieDetail.innerHTML = voiture.images.map((img, index) => `
            <img src="${img}" class="photo-galerie ${index === 0 ? 'active' : ''}" onclick="changerImageDetail(this, '${img}')">
        `).join('');
    }

    const message = `Bonjour, je suis intéressé par cette voiture: ${voiture.make} ${voiture.model} ${voiture.year} - Prix: ${voiture.price.toLocaleString()} FCFA`;
    const messageEncode = encodeURIComponent(message);

    if (lienWhatsappDetail) lienWhatsappDetail.href = `https://wa.me/15813983636?text=${messageEncode}`;

    if (vueDetail) {
        vueDetail.classList.add('actif');
        document.body.classList.add('sans-defilement');
    }
};

window.changerImageDetail = function (photo, src) {
    const imgDetailHero = document.getElementById('img-detail-hero');
    if (imgDetailHero) imgDetailHero.src = src;
    document.querySelectorAll('.photo-galerie').forEach(p => p.classList.remove('actif'));
    photo.classList.add('actif');
};

document.addEventListener('DOMContentLoaded', async () => {
    const navBurger = document.getElementById('menu-burger-nav');
    const navLiens = document.getElementById('liens-navigation');
    const body = document.body;

    if (navBurger && navLiens) {
        console.log("Sidebar elements found, attaching listener");
        navBurger.addEventListener('click', (e) => {
            console.log("Burger clicked");
            e.stopPropagation();
            navBurger.classList.toggle('actif');
            navLiens.classList.toggle('actif');
            body.classList.toggle('nav-ouvert');
            body.classList.toggle('sans-defilement');
        });

        navLiens.querySelectorAll('a').forEach(lien => {
            lien.addEventListener('click', (e) => {
                const href = lien.getAttribute('href');

                if (href.startsWith('#')) {
                    e.preventDefault();
                    navBurger.classList.remove('actif');
                    navLiens.classList.remove('actif');
                    body.classList.remove('nav-ouvert');
                    body.classList.remove('sans-defilement');

                    const cible = document.querySelector(href);
                    if (cible) {
                        setTimeout(() => {
                            cible.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                    }
                } else {
                    navBurger.classList.remove('actif');
                    navLiens.classList.remove('actif');
                    body.classList.remove('nav-ouvert');
                    body.classList.remove('sans-defilement');
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!navBurger.contains(e.target) && !navLiens.contains(e.target)) {
                if (navLiens.classList.contains('actif')) {
                    navBurger.classList.remove('actif');
                    navLiens.classList.remove('actif');
                    body.classList.remove('nav-ouvert');
                    body.classList.remove('sans-defilement');
                }
            }
        });
    } else {
        console.error("Sidebar elements NOT found");
    }

    await chargerDonneesVoitures();

    const btnFermerDetail = document.getElementById('btn-fermer-detail');
    const vueDetail = document.getElementById('vue-detail');

    if (btnFermerDetail && vueDetail) {
        btnFermerDetail.addEventListener('click', () => {
            vueDetail.classList.remove('actif');
            document.body.classList.remove('sans-defilement');
        });
    }

    const parametresUrl = new URLSearchParams(window.location.search);
    const paramIdVoiture = parametresUrl.get('id');
    if (paramIdVoiture) {
        const idVoiture = parseInt(paramIdVoiture);

        setTimeout(() => {
            ouvrirVueDetail(idVoiture);
        }, 100);
    }



    const observateur = new IntersectionObserver((entrees) => {
        entrees.forEach(entree => {
            if (entree.isIntersecting) {
                entree.target.classList.add('actif');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section, .carte-voiture, .carte-expertise').forEach(el => {
        el.classList.add('element-revele');
        observateur.observe(el);
    });

    const formulaireContact = document.getElementById('formulaire-contact-public');
    if (formulaireContact) {
        formulaireContact.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(formulaireContact);
            const prenom = formData.get('Prenom');
            const nom = formData.get('Nom');
            const email = formData.get('Email');
            const telPrefix = document.getElementById('code-pays-contact').value;
            const telNumber = formData.get('Telephone');
            const messageObj = formData.get('Message');

            const fullMessage = `Nom: ${prenom} ${nom}\nEmail: ${email}\nTéléphone: ${telPrefix} ${telNumber}\n\nMessage:\n${messageObj}`;

            const subject = "Contact depuis le site Carsen";
            const mailtoLink = `mailto:carsenautomobile@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`;

            window.location.href = mailtoLink;
        });
    }
});
