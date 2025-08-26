// Aguarda a página carregar completamente antes de executar o código
document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES E VARIÁVEIS GLOBAIS ---
    const API_BASE_URL = 'https://pokeapi.co/api/v2';
    const MAX_POKEMON_ID = 1025; // Número máximo de Pokémon na API

    // Associa os elementos do HTML a variáveis para podermos usá-los no JavaScript
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

    // Associa cada tipo de Pokémon a uma cor específica
    const typeColors = {
        grass:    { class: 'bg-green-500',  color: 'rgba(34, 197, 94, 0.3)' },
        fire:     { class: 'bg-red-500',    color: 'rgba(239, 68, 68, 0.3)' },
        water:    { class: 'bg-blue-500',   color: 'rgba(59, 130, 246, 0.3)' },
        bug:      { class: 'bg-lime-500',   color: 'rgba(132, 204, 22, 0.3)' },
        normal:   { class: 'bg-gray-400',   color: 'rgba(156, 163, 175, 0.3)' },
        poison:   { class: 'bg-purple-600', color: 'rgba(147, 51, 234, 0.3)' },
        electric: { class: 'bg-yellow-400', color: 'rgba(250, 204, 21, 0.3)' },
        ground:   { class: 'bg-yellow-600', color: 'rgba(202, 138, 4, 0.3)' },
        fairy:    { class: 'bg-pink-400',   color: 'rgba(244, 114, 182, 0.3)' },
        fighting: { class: 'bg-orange-700', color: 'rgba(194, 65, 12, 0.3)' },
        psychic:  { class: 'bg-pink-600',   color: 'rgba(219, 39, 119, 0.3)' },
        rock:     { class: 'bg-yellow-700', color: 'rgba(161, 98, 7, 0.3)' },
        ghost:    { class: 'bg-indigo-700', color: 'rgba(67, 56, 202, 0.3)' },
        ice:      { class: 'bg-cyan-300',   color: 'rgba(103, 232, 249, 0.3)' },
        dragon:   { class: 'bg-indigo-500', color: 'rgba(99, 102, 241, 0.3)' },
        dark:     { class: 'bg-gray-800',   color: 'rgba(31, 41, 55, 0.3)' },
        steel:    { class: 'bg-gray-500',   color: 'rgba(107, 114, 128, 0.3)' },
        flying:   { class: 'bg-sky-400',    color: 'rgba(56, 189, 248, 0.3)' }
    };

    // Guarda os dados do Pokémon que está a ser mostrado
    let currentPokemon = {};

    // --- FUNÇÕES DE LÓGICA PRINCIPAL ---

    // Função para buscar dados na API
    const fetchApiData = async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.status}`);
        }
        return response.json();
    };

    // Função principal que busca os dados de um Pokémon
    const fetchPokemon = async (identifier) => {
        setLoadingState(true); // Mostra a animação de carregamento
        try {
            // Busca os dados principais e os da espécie ao mesmo tempo para ser mais rápido
            const pokemonData = await fetchApiData(`pokemon/${identifier.toString().toLowerCase()}`);
            const speciesData = await fetchApiData(`pokemon-species/${identifier.toString().toLowerCase()}`);
            
            // Combina as informações e guarda os dados do Pokémon atual
            currentPokemon = { ...pokemonData, speciesData };
            renderPokemon(currentPokemon); // Mostra as informações do Pokémon na página
            
            // Se o Pokémon tiver evoluções, busca essas informações
            if (speciesData?.evolution_chain?.url) {
                const evolutionData = await fetch(speciesData.evolution_chain.url).then(res => res.json());
                renderEvolutionChain(evolutionData.chain);
            }
        } catch (error) {
            console.error('Falha ao buscar Pokémon:', error);
            showError(); // Mostra uma mensagem de erro na página
        } finally {
            setLoadingState(false); // Esconde a animação de carregamento, quer tenha funcionado ou não
        }
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO (UI) ---

    // Função para controlar a animação de carregamento
    const setLoadingState = (isLoading) => {
        elements.loader.classList.toggle('hidden', !isLoading);
        elements.content.classList.toggle('hidden', isLoading);
        elements.errorMessage.classList.add('hidden'); // Garante que a mensagem de erro está escondida
    };

    // Função que mostra a mensagem de erro
    const showError = () => {
        elements.errorMessage.classList.remove('hidden');
        elements.content.classList.add('hidden');
    };

    // Função que mostra as informações do Pokémon na página
    const renderPokemon = (data) => {
        // Coloca a imagem, o nome e o número do Pokémon nos seus lugares
        elements.image.src = data.sprites.other['official-artwork'].front_default || '';
        elements.image.alt = `Imagem de ${data.name}`;
        elements.name.textContent = data.name;
        elements.id.textContent = `#${data.id.toString().padStart(3, '0')}`;
        
        // Limpa os tipos antigos e adiciona os novos
        elements.types.innerHTML = '';
        data.types.forEach(typeInfo => {
            const typeName = typeInfo.type.name;
            const typeStyle = typeColors[typeName] || { class: 'bg-gray-500' };
            const typeElement = document.createElement('span');
            typeElement.textContent = typeName;
            typeElement.className = `px-3 py-1 rounded-full text-white text-xs font-bold ${typeStyle.class}`;
            elements.types.appendChild(typeElement);
        });

        // Muda a cor de fundo da área de visualização para combinar com o tipo do Pokémon
        const primaryType = data.types[0].type.name;
        elements.display.style.backgroundColor = (typeColors[primaryType] || { color: 'rgba(107, 114, 128, 0.3)' }).color;
    };

    // Função que mostra a linha de evolução
    const renderEvolutionChain = async (chainData) => {
        elements.evolutionStages.innerHTML = ''; // Limpa as evoluções anteriores
        const evolutionChain = parseEvolutionChain(chainData);
        
        // Percorre cada Pokémon na linha de evolução
        for (let i = 0; i < evolutionChain.length; i++) {
            const speciesName = evolutionChain[i];
            try {
                // Busca os dados de cada evolução para mostrar a sua imagem
                const pokemon = await fetchApiData(`pokemon/${speciesName}`);
                const stageDiv = document.createElement('div');
                stageDiv.className = 'evolution-stage text-center';
                stageDiv.innerHTML = `
                    <img src="${pokemon.sprites.front_default}" alt="${speciesName}" class="mx-auto">
                    <p class="capitalize">${speciesName}</p>
                `;
                // Faz com que seja possível clicar na evolução para a ver
                stageDiv.addEventListener('click', () => fetchPokemon(speciesName));
                elements.evolutionStages.appendChild(stageDiv);

                // Coloca uma seta entre as evoluções
                if (i < evolutionChain.length - 1) {
                    const arrow = document.createElement('span');
                    arrow.className = 'evolution-arrow';
                    arrow.textContent = '→';
                    elements.evolutionStages.appendChild(arrow);
                }
            } catch (error) {
                console.error(`Não foi possível carregar a evolução: ${speciesName}`, error);
            }
        }
    };

    // Função que organiza a linha de evolução
    const parseEvolutionChain = (chain) => {
        const evolutions = [];
        let currentStage = chain;
        while (currentStage) {
            evolutions.push(currentStage.species.name);
            currentStage = currentStage.evolves_to[0];
        }
        return evolutions;
    };

    // --- EVENT LISTENERS ---

    // Função que faz os botões funcionar
    const setupEventListeners = () => {
        // Quando o utilizador pesquisa
        elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = elements.searchInput.value.trim();
            if (searchTerm) fetchPokemon(searchTerm);
        });

        // Quando o utilizador clica no botão para trás
        elements.prevButton.addEventListener('click', () => {
            if (currentPokemon.id > 1) fetchPokemon(currentPokemon.id - 1);
        });

        // Quando o utilizador clica no botão para a frente
        elements.nextButton.addEventListener('click', () => {
            if (currentPokemon.id < MAX_POKEMON_ID) fetchPokemon(currentPokemon.id + 1);
        });
    };

    // --- INICIALIZAÇÃO ---

    // Função que inicia tudo
    const init = () => {
        setupEventListeners();
        fetchPokemon(1); // Busca o primeiro Pokémon (Bulbasaur) assim que a página abre
    };

    // Começa a aplicação
    init();
});