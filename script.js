document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES E VARIÁVEIS GLOBAIS ---
    const API_BASE_URL = 'https://pokeapi.co/api/v2';
    const MAX_POKEMON_ID = 1025; // O número máximo de Pokémon a considerar

    // Mapeamento dos elementos do HTML para fácil acesso
    const elements = {
        display: document.getElementById('pokemon-display'),
        content: document.getElementById('pokemon-content'),
        image: document.getElementById('pokemon-image'),
        name: document.getElementById('pokemon-name'),
        id: document.getElementById('pokemon-id'),
        types: document.getElementById('pokemon-types'),
        searchForm: document.getElementById('search-form'),
        searchInput: document.getElementById('search-input'),
        prevButton: document.getElementById('prev-button'),
        nextButton: document.getElementById('next-button'),
        loader: document.getElementById('loader'),
        errorMessage: document.getElementById('error-message'),
        evolutionStages: document.getElementById('evolution-stages'),
    };

    let currentPokemon = {}; // Guarda os dados do Pokémon que está a ser exibido

    // --- FUNÇÕES DE LÓGICA DA APLICAÇÃO ---

    // Função genérica para fazer pedidos à API
    const fetchApiData = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.status}`);
        }
        return response.json();
    };

    // Função principal que busca os dados de um Pokémon
    const fetchPokemon = async (identifier) => {
        setLoadingState(true);
        try {
            // Busca os dados principais e os dados da espécie (para evolução)
            const pokemonData = await fetchApiData(`${API_BASE_URL}/pokemon/${identifier.toString().toLowerCase()}`);
            const speciesData = await fetchApiData(pokemonData.species.url);
            
            currentPokemon = { ...pokemonData, speciesData };
            renderPokemon(currentPokemon);
            
            // Se houver uma cadeia de evolução, busca e exibe
            if (speciesData?.evolution_chain?.url) {
                const evolutionData = await fetchApiData(speciesData.evolution_chain.url);
                renderEvolutionChain(evolutionData.chain);
            } else {
                 elements.evolutionStages.innerHTML = '<p class="text-white text-xs">Sem evoluções</p>';
            }

        } catch (error) {
            console.error('Falha ao buscar Pokémon:', error);
            showError();
        } finally {
            setLoadingState(false);
        }
    };

    // Controla a exibição do loader e do conteúdo
    const setLoadingState = (isLoading) => {
        elements.loader.classList.toggle('hidden', !isLoading);
        elements.content.classList.toggle('hidden', isLoading);
        elements.errorMessage.classList.add('hidden'); // Esconde a mensagem de erro ao carregar
    };

    // Exibe uma mensagem de erro se o Pokémon não for encontrado
    const showError = () => {
        elements.errorMessage.classList.remove('hidden');
        elements.content.classList.add('hidden');
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO (EXIBIÇÃO NA PÁGINA) ---

    // Exibe os dados do Pokémon no ecrã
    const renderPokemon = (data) => {
        elements.image.src = data.sprites.other['official-artwork'].front_default || './placeholder.png'; // Imagem de fallback
        elements.image.alt = `Imagem de ${data.name}`;
        elements.name.textContent = data.name;
        elements.id.textContent = `#${data.id.toString().padStart(4, '0')}`;
        
        // Limpa e cria as "tags" de tipo
        elements.types.innerHTML = '';
        data.types.forEach(typeInfo => {
            const typeName = typeInfo.type.name;
            const typeElement = document.createElement('span');
            typeElement.textContent = typeName;
            // Adiciona a classe CSS correspondente ao tipo
            typeElement.className = `type-tag type-${typeName}`;
            elements.types.appendChild(typeElement);
        });

        // Muda a cor de fundo do ecrã com base no primeiro tipo do Pokémon
        const primaryType = data.types[0].type.name;
        elements.display.setAttribute('data-type', primaryType);
    };

    // Exibe a cadeia de evolução
    const renderEvolutionChain = async (chainData) => {
        elements.evolutionStages.innerHTML = ''; // Limpa a secção
        const evolutionChain = parseEvolutionChain(chainData);
        
        if (evolutionChain.length <= 1) {
            elements.evolutionStages.innerHTML = '<p class="text-white text-xs font-pixel">Não possui outras evoluções</p>';
            return;
        }

        for (let i = 0; i < evolutionChain.length; i++) {
            const speciesName = evolutionChain[i];
            try {
                // Busca os dados de cada Pokémon na cadeia
                const pokemon = await fetchApiData(`${API_BASE_URL}/pokemon/${speciesName}`);
                const stageDiv = document.createElement('div');
                stageDiv.className = 'evolution-stage';
                stageDiv.innerHTML = `
                    <img src="${pokemon.sprites.front_default || './placeholder.png'}" alt="${speciesName}" class="mx-auto drop-shadow-md">
                    <p class="capitalize text-white text-xs font-pixel">${speciesName}</p>
                `;
                // Adiciona um evento para que se possa clicar na evolução
                stageDiv.addEventListener('click', () => fetchPokemon(speciesName));
                elements.evolutionStages.appendChild(stageDiv);

                // Adiciona uma seta entre as evoluções
                if (i < evolutionChain.length - 1) {
                    const arrow = document.createElement('span');
                    arrow.className = 'evolution-arrow text-white';
                    arrow.textContent = '→';
                    elements.evolutionStages.appendChild(arrow);
                }
            } catch (error) {
                console.error(`Não foi possível carregar a evolução: ${speciesName}`, error);
            }
        }
    };

    // Extrai os nomes dos Pokémon da estrutura da API de evolução
    const parseEvolutionChain = (chain) => {
        const evolutions = [];
        let currentStage = chain;
        while (currentStage) {
            evolutions.push(currentStage.species.name);
            currentStage = currentStage.evolves_to[0]; // Pega a primeira evolução, se houver
        }
        return evolutions;
    };

    // --- EVENT LISTENERS (INTERATIVIDADE) ---

    // Configura todos os eventos de clique e de formulário
    const setupEventListeners = () => {
        elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = elements.searchInput.value.trim();
            if (searchTerm) fetchPokemon(searchTerm);
        });

        elements.prevButton.addEventListener('click', () => {
            if (currentPokemon.id > 1) fetchPokemon(currentPokemon.id - 1);
        });

        elements.nextButton.addEventListener('click', () => {
            if (currentPokemon.id < MAX_POKEMON_ID) fetchPokemon(currentPokemon.id + 1);
        });
    };

    // --- LÓGICA DO PWA (PROGRESSIVE WEB APP) ---

    // Regista o Service Worker para que a aplicação funcione offline
    const registerServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').then(registration => {
                    console.log('Service Worker registado com sucesso:', registration.scope);
                }).catch(error => {
                    console.log('Falha ao registar o Service Worker:', error);
                });
            });
        }
    };


    // Função que inicia tudo
    const init = () => {
        setupEventListeners();
        fetchPokemon(1); // Começa mostrando o Pokémon #1 (Bulbasaur)
        registerServiceWorker(); // Ativa as funcionalidades de PWA
    };

    init();
});