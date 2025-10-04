document.addEventListener('DOMContentLoaded', () => {

  const elements = {
    mainDisplay: document.getElementById('main-pokemon-display'),
    searchInput: document.getElementById('search-input'),
    prevButton: document.getElementById('prev-btn'),
    nextButton: document.getElementById('next-btn'),
    evolutionStages: document.getElementById('evolution-stages')
  };

  let currentPokemonId = 1;

  async function fetchPokemon(identifier) {
    showLoader(true);
    try {
      const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${identifier}`;
      const pokemonResponse = await fetch(pokemonUrl);
      if (!pokemonResponse.ok) throw new Error('Pokémon não encontrado!');
      const pokemonData = await pokemonResponse.json();
      
      currentPokemonId = pokemonData.id;

      const speciesUrl = pokemonData.species.url;
      const speciesResponse = await fetch(speciesUrl);
      const speciesData = await speciesResponse.json();
      
      const evolutionData = await fetch(speciesData.evolution_chain.url).then(res => res.json());

      renderPokemon(pokemonData);
      renderEvolutionChain(evolutionData.chain);

    } catch (error) {
      console.error("Erro ao buscar Pokémon:", error);
      elements.mainDisplay.innerHTML = `<p class="error-message">Pokémon não encontrado!</p>`;
    } finally {
      showLoader(false);
    }
  }

  function showLoader(isLoading) {
    if (isLoading) {
      elements.mainDisplay.innerHTML = `<div class="loader"></div>`;
      elements.evolutionStages.innerHTML = '';
    }
  }

  function renderPokemon(data) {
    const primaryType = data.types[0].type.name;

    elements.mainDisplay.innerHTML = `
      <div class="pokemon-image-container" data-type="${primaryType}">
        <img src="${data.sprites.front_default}" alt="${data.name}" class="pokemon-image">
      </div>
      <h2 class="pokemon-name">${data.name}</h2>
      <p class="pokemon-id">#${String(data.id).padStart(3, '0')}</p>
      <div class="pokemon-types">
        ${data.types.map(typeInfo => `<span class="type-badge" data-type="${typeInfo.type.name}">${typeInfo.type.name}</span>`).join('')}
      </div>
    `;
  }

  async function renderEvolutionChain(chain) {
    elements.evolutionStages.innerHTML = '';
    let currentStage = chain;

    while (currentStage) {
      const pokemonName = currentStage.species.name;
      
      const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`).then(res => res.json());
      const imageUrl = pokemonData.sprites.front_default;

      const stageElement = document.createElement('div');
      stageElement.classList.add('evolution-stage');
      stageElement.innerHTML = `
        <img src="${imageUrl}" alt="${pokemonName}">
        <p>${pokemonName}</p>
      `;
      stageElement.addEventListener('click', () => fetchPokemon(pokemonName));
      elements.evolutionStages.appendChild(stageElement);

      currentStage = currentStage.evolves_to[0];
    }
  }

  elements.searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const searchTerm = elements.searchInput.value.toLowerCase().trim();
      if (searchTerm) {
        fetchPokemon(searchTerm);
      }
    }
  });

  elements.nextButton.addEventListener('click', () => {
    currentPokemonId++;
    fetchPokemon(currentPokemonId);
  });

  elements.prevButton.addEventListener('click', () => {
    if (currentPokemonId > 1) {
      currentPokemonId--;
      fetchPokemon(currentPokemonId);
    }
  });

  fetchPokemon(currentPokemonId);

  const cameraInput = document.getElementById('camera-input');
  const photoModal = document.getElementById('photo-modal');
  const capturedPhoto = document.getElementById('captured-photo');
  const closePhotoButton = document.getElementById('close-photo-btn');

  cameraInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      capturedPhoto.src = imageUrl;
      photoModal.classList.remove('hidden');
    }
  });

  closePhotoButton.addEventListener('click', () => {
    photoModal.classList.add('hidden');
    URL.revokeObjectURL(capturedPhoto.src);
    capturedPhoto.src = "";
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch(error => {
          console.log('Falha ao registrar o Service Worker:', error);
        });
    });
  }

});