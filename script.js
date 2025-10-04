// Espera todo o conteúdo da página carregar antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

  // --- MAPEAMENTO DOS ELEMENTOS DO HTML ---
  // Guarda referências aos elementos da página para não ter que procurá-los toda hora
  const elements = {
    mainDisplay: document.getElementById('main-pokemon-display'),
    searchInput: document.getElementById('search-input'),
    prevButton: document.getElementById('prev-btn'),
    nextButton: document.getElementById('next-btn'),
    evolutionStages: document.getElementById('evolution-stages')
  };

  // --- VARIÁVEIS DE ESTADO DA APLICAÇÃO ---
  // Guarda o estado atual da aplicação, como o ID do Pokémon que está a ser mostrado
  let currentPokemonId = 1;

  // --- FUNÇÕES PRINCIPAIS ---

  /**
   * Função principal que busca os dados de um Pokémon na API.
   * @param {string|number} identifier - O nome ou o número do Pokémon a ser buscado.
   */
  async function fetchPokemon(identifier) {
    // Mostra um loader enquanto os dados são carregados
    showLoader(true);
    try {
      // Busca os dados básicos do Pokémon
      const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${identifier}`;
      const pokemonResponse = await fetch(pokemonUrl);
      if (!pokemonResponse.ok) throw new Error('Pokémon não encontrado!');
      const pokemonData = await pokemonResponse.json();
      
      // Atualiza o ID atual
      currentPokemonId = pokemonData.id;

      // Busca dados adicionais da espécie (necessário para a evolução)
      const speciesUrl = pokemonData.species.url;
      const speciesResponse = await fetch(speciesUrl);
      const speciesData = await speciesResponse.json();
      
      // Busca a cadeia de evolução
      const evolutionData = await fetch(speciesData.evolution_chain.url).then(res => res.json());

      // Renderiza o Pokémon principal e sua cadeia de evolução
      renderPokemon(pokemonData);
      renderEvolutionChain(evolutionData.chain);

    } catch (error) {
      console.error("Erro ao buscar Pokémon:", error);
      elements.mainDisplay.innerHTML = `<p class="error-message">Pokémon não encontrado!</p>`;
    } finally {
      // Esconde o loader depois que tudo terminar
      showLoader(false);
    }
  }

  // --- FUNÇÕES DE RENDERIZAÇÃO (PARA MOSTRAR AS COISAS NA PÁGINA) ---

  /**
   * Mostra ou esconde o anel de carregamento (loader).
   * @param {boolean} isLoading - `true` para mostrar, `false` para esconder.
   */
  function showLoader(isLoading) {
    if (isLoading) {
      elements.mainDisplay.innerHTML = `<div class="loader"></div>`;
      elements.evolutionStages.innerHTML = '';
    }
  }

  /**
   * Cria o HTML para o Pokémon principal e o insere na página.
   * @param {object} data - Os dados do Pokémon vindos da API.
   */
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

  /**
   * Processa e exibe a cadeia de evolução de um Pokémon.
   * @param {object} chain - O objeto da cadeia de evolução vindo da API.
   */
  async function renderEvolutionChain(chain) {
    elements.evolutionStages.innerHTML = '';
    let currentStage = chain;

    // Loop para percorrer todos os estágios da evolução
    while (currentStage) {
      const pokemonName = currentStage.species.name;
      
      // Busca a imagem de cada Pokémon na cadeia
      const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`).then(res => res.json());
      const imageUrl = pokemonData.sprites.front_default;

      // Cria o HTML para o estágio da evolução
      const stageElement = document.createElement('div');
      stageElement.classList.add('evolution-stage');
      stageElement.innerHTML = `
        <img src="${imageUrl}" alt="${pokemonName}">
        <p>${pokemonName}</p>
      `;
      // Adiciona um evento de clique para carregar o Pokémon clicado
      stageElement.addEventListener('click', () => fetchPokemon(pokemonName));
      elements.evolutionStages.appendChild(stageElement);

      // Passa para o próximo estágio da evolução
      currentStage = currentStage.evolves_to[0];
    }
  }

  // --- EVENT LISTENERS (AÇÕES DO UTILIZADOR) ---

  // Evento para a barra de pesquisa (acionado ao pressionar Enter)
  elements.searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const searchTerm = elements.searchInput.value.toLowerCase().trim();
      if (searchTerm) {
        fetchPokemon(searchTerm);
      }
    }
  });

  // Evento para o botão "Próximo"
  elements.nextButton.addEventListener('click', () => {
    currentPokemonId++;
    fetchPokemon(currentPokemonId);
  });

  // Evento para o botão "Anterior"
  elements.prevButton.addEventListener('click', () => {
    if (currentPokemonId > 1) {
      currentPokemonId--;
      fetchPokemon(currentPokemonId);
    }
  });

  // --- INICIALIZAÇÃO ---
  // Carrega o primeiro Pokémon ao abrir a página
  fetchPokemon(currentPokemonId);

  // --- LÓGICA DA CÂMERA (HTML Media Capture) ---

  // Mapeia os elementos da interface da câmera
  const cameraInput = document.getElementById('camera-input');
  const photoModal = document.getElementById('photo-modal');
  const capturedPhoto = document.getElementById('captured-photo');
  const closePhotoButton = document.getElementById('close-photo-btn');

  // Evento que acontece quando o utilizador tira uma foto
  cameraInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      // Cria um URL para a imagem capturada
      const imageUrl = URL.createObjectURL(file);
      capturedPhoto.src = imageUrl;
      // Mostra o modal com a foto
      photoModal.classList.remove('hidden');
    }
  });

  // Evento para fechar o modal da foto
  closePhotoButton.addEventListener('click', () => {
    photoModal.classList.add('hidden');
    // Limpa a imagem para libertar memória
    URL.revokeObjectURL(capturedPhoto.src);
    capturedPhoto.src = "";
  });

  // --- REGISTRO DO SERVICE WORKER (PARA O PWA) ---
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