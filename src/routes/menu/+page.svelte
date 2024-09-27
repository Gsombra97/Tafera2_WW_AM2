<script>
    import { onMount } from "svelte";
    import Footer from "../../components/Footer.svelte";
    import { auth, db, storage } from "../../lib/firebase/firebase";
    import { authHandlers, authStore } from "../../store/store";
    import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
    import {
        setDoc,
        getDocs,
        doc,
        collection,
        addDoc,
        updateDoc,
    } from "firebase/firestore";

    let data = [];
    let listProduct = [];
    let addProduct = [];
    let filterStyle = "";
    let name = "";
    let description = "";
    let price = "";
    let mode = 1;
    let imageFile = null;
    let currentPage = 1;
    const productsPerPage = 20;
    let maxPage;
    let isEditing = false;
    let editProduct = null;
    let currentPageProducts = []; // Variável para armazenar os produtos da página atual

    function handleFileSelect(event) {
        imageFile = event.target.files[0];
    }

    authStore.subscribe((curr) => {
        console.log(curr)
        listProduct = curr.data?.cart || [];
    });

    onMount(async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            data = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            data = [...data];
            maxPage = Math.ceil(data.length / productsPerPage);
            getCurrentPageProducts(); // Chama a função para carregar os produtos da primeira página
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
        }
    });

    async function addProductToMenu(name, description, price) {
    if (!imageFile && !isEditing) {
        alert("Selecione uma imagem para o produto.");
        return;
    }

    try {
        let imageUrl = editProduct?.imagemUrl || ""; // Use a URL da imagem antiga inicialmente

        // Se estiver editando e um novo arquivo de imagem for selecionado, faça o upload
        if (imageFile) {
            const imageRef = ref(storage, `images/${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref); // Atualiza a URL da imagem
        }

        const dataToSetToStore = {
            nome: name,
            descricao: description,
            preco: price,
            imagemUrl: imageUrl, // Atualize o campo imagemUrl com a URL apropriada
        };

        if (isEditing && editProduct) {
            const productRef = doc(db, "products", editProduct.id);
            await updateDoc(productRef, dataToSetToStore);
            isEditing = false;
            editProduct = null;
        } else {
            await addDoc(collection(db, "products"), dataToSetToStore);
        }

        location.reload();
    } catch (error) {
        console.error("Erro ao adicionar/editar o produto:", error);
    }
}

    function startEdit(product) {
      isEditing = true;
       editProduct = product;
      name = product.nome;
     description = product.descricao;
     price = product.preco;
      // Remova a linha abaixo
     // imageFile = product.imagemUrl;
      mode = 0;
}

    function handleFilter() {
        if (filterStyle === "Alfabetico") {
            data = [...data].sort((a, b) =>
                a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" }),
            );
        } else if (filterStyle === "Menor preço") {
            data = [...data].sort((a, b) => a.preco - b.preco);
        } else if (filterStyle === "Maior preço") {
            data = [...data].sort((a, b) => b.preco - a.preco);
        }
        maxPage = Math.ceil(data.length / productsPerPage); // Atualiza o número máximo de páginas
        currentPage = 1; // Reseta para a primeira página ao aplicar um filtro
        getCurrentPageProducts(); // Atualiza a exibição com o filtro aplicado
    }

    function changePage(newPage) {
        if (newPage > 0 && newPage <= maxPage) {
            currentPage = newPage;
            getCurrentPageProducts(); // Atualiza os produtos na página atual
        }
    }

    function getCurrentPageProducts() {
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        currentPageProducts = data.slice(startIndex, endIndex); // Atualiza a lista de produtos da página atual
    }
</script>

<div class="mainContainer">
    <div class="headerContainer">
        <h1>WW Loja de TI</h1>
        <div class="headerBtns">
            <button on:click={authHandlers.logout}
                ><i class="fa-solid fa-right-from-bracket"></i>Logout</button
            >
            {#if mode}
                <button on:click={() => (mode = 0)}
                    ><i class="fa-solid fa-plus"></i>Adicionar produto</button
                >
            {:else}
                <button on:click={() => (mode = 1)}
                    ><i class="fa-solid fa-arrow-left"></i>Menu</button
                >
            {/if}
            <select bind:value={filterStyle} on:change={handleFilter}>
                <option value="" disabled selected>Filtro</option>
                <option value="Alfabetico">Alfabetico</option>
                <option value="Menor preço">Menor preço</option>
                <option value="Maior preço">Maior preço</option>
            </select>
        </div>
    </div>

    {#if mode}
        <div class="listProductsContainer">
            {#each currentPageProducts as dado, index}
                <div class="listProduct" key={index}>
                    <div class="product">
                        <h2>{dado.nome}</h2>
                        <p>{dado.descricao}</p>
                        {#if dado.imagemUrl}
                            <img src={dado.imagemUrl} alt={dado.nome} />
                        {/if}
                    </div>
                    <div class="economics">
                        <p>{dado.preco} R$</p>
                        <button on:click={() => startEdit(dado)}>Editar</button>
                        <!-- Botão de Editar -->
                    </div>
                </div>
            {/each}
        </div>

        <div class="pagination">
            <button
                on:click={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}>Anterior</button
            >
            <span>Página {currentPage} de {maxPage}</span>
            <button
                on:click={() => changePage(currentPage + 1)}
                disabled={currentPage === maxPage}>Próximo</button
            >
        </div>
    {:else}
        <h2>{isEditing ? "Editar produto" : "Adicionar produto"}</h2>
        <!-- Mudança no título -->
        <form>
            <input
                type="text"
                bind:value={name}
                required
                placeholder="Nome do produto"
            />
            <input
                type="text"
                bind:value={description}
                required
                placeholder="Descrição do produto"
            />
            <input
                type="number"
                bind:value={price}
                required
                placeholder="Preço do produto"
            />
            <input
                type="file"
                accept="image/*"
                on:change={handleFileSelect}
                required={!isEditing}
            />
            <!-- Não requer imagem ao editar -->
            <button
                type="button"
                on:click={() => addProductToMenu(name, description, price)}
            >
                {isEditing ? "Salvar alterações" : "Adicionar produto"}
            </button>
        </form>
    {/if}
</div>

<Footer />

<style>
    .mainContainer {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        gap: 24px;
        padding: 0 24px; /* Mantém o padding apenas nas laterais para o conteúdo */
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
    }

    .headerContainer {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100vw; /* Alarga o header para a largura completa da viewport */
        margin-left: calc(
            -50vw + 50%
        ); /* Compensa o margin do body para alinhar corretamente */
        padding: 10px 24px; /* Adiciona o padding lateral, se necessário */
        box-sizing: border-box; /* Garante que o padding não afete a largura total */
        background-color: #BA0D3A;
    }
    .headerContainer img {
        width: 60px;
    }
    .headerBtns {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .listProduct {
        display: flex;
        flex-direction: column;
        padding: 20px;
        border-radius: 8px;
        border: 2px solid #ED0D16;
        text-align: center;
        background-color: #0B1717;
        

    }

    .listProductsContainer {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        width: 100%;
        height: 100%;
        margin: 20px;
    }

    .pagination{
        margin-bottom: 20px;
        margin: auto;
    }

    .product img {
        max-width: 100px;
        max-height: 100px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 0 auto;
        margin-left: 20%;
    }
    .product {
        max-width: 80%;
        height: 90%;
        display: flex;
        flex-direction: column;
        align-content: center;
        margin: 0 auto;
        gap: 10px; /* Define o espaçamento entre os itens internos do div */
        padding: 20px; /* Adiciona padding interno ao redor do conteúdo */
    }
    .product p {
        font-family: "Raleway";
    }
    .economics {
        font-family: "PT sans";
        font-weight: 800;
    }

    .economics p{
        margin-bottom:10px;
    }

    button,
    select {
        background: #0B1717;
        color: white;
        padding: 10px 18px;
        font-weight: 700;
        align-items: center;
        gap: 10px;
        border: 2px solid #ED0D16;
        border-radius: 12px;
    }
    

    button i {
        font-size: 1.1rem;
        padding-right: 10px;
    }

    form {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        gap: 24px;
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
    }

    input {
        height: 40px;
        border: 2px solid #ED0D16;
        border-radius: 4px;
    }

    .pop-up-quantity {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0;
        width: 100%;
        height: 100vh;
        background-color: #0B1717;
    }
    .pop-up {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        background-color: #0B1717;
        border-radius: 4px;
        text-align: center;
        width: 30%;
        height: 70%;
        padding: 20px;
        position: fixed;
    }

    img {
        max-width: 100px;
        max-height: 100px;
        object-fit: cover;
        border-radius: 4px;
    }

    @media (max-width: 1024px) {
        .listProductsContainer {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 768px) {
        .listProductsContainer {
            grid-template-columns: 1fr;
        }
    }
</style>
