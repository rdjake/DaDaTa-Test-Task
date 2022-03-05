const html = `
<main class="main">
  <section class="wrapper">
    <p><strong>Компания или ИП</strong></p>
    <input id="party" name="party" type="text" placeholder="Введите название, ИНН, ОГРН или адрес организации" />
    <div id="partyOptions" ></div>
  </section>

  <section class="wrapper">
    <div class="row">
      <label>Краткое наименование</label>
      <input id="nameShort">
    </div>
    <div class="row">
      <label>Полное наименование</label>
      <input id="nameFull">
    </div>
    <div class="row">
      <label>ИНН / КПП</label>
      <input id="innKpp">
    </div>
    <div class="row">
      <label>Адрес</label>
      <input id="address">
    </div>
  </section>
</main>
`;
const styles = `
<style>

  .main{
    --borderRadius: 6px;
    background-color: #f2f2f2;
    box-shadow: 0 0 4px 1px #f2f2f2;
    border-radius: var(--borderRadius);
    padding: 4px;
    width: 900px;
    max-width: 900px;
    min-width: 300px;
    box-sizing: border-box;
  }

  body {
    padding: 1rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  input {
    font-size: 16px;
    padding: 4px;
    width: 100%;
    box-sizing: border-box;
    border-width: 1px;
    border-radius: var(--borderRadius);
  }

  .wrapper {
    margin: 1em;
  }

  .row {
    margin-top: 1em;
  }

  .row label {
    display: block;
  }

  #partyOptions{
    display: none;
    border: 1px solid black;
    border-radius: var(--borderRadius);
    background-color: white;
  }

  #partyOptions p{
    color: black;
    margin: 0;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: var(--borderRadius);
  }

  #partyOptions p:hover{
    background-color: #f2f2f2;
  }

  @media only screen and (max-width: 900px) {
    .main {
      width: 100%;
    }
  }

</style>`;

const rootElement = document.createElement('template');
rootElement.innerHTML =  html + styles;

window.customElements.define('party-search-form',  class extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(rootElement.content.cloneNode(true));
   
    this.#url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party"
    this.#token = "32ee3f7916dc50c71924b9e7b96790cb730d9775";
    this.#options = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Token " + this.#token
      }
    }    
    this.#inputs = ['nameShort','nameFull','innKpp','address','party','partyOptions'].reduce((s,v) => ({...s, [v]: this.shadowRoot.querySelector('#'+v)}),{});
    this.emptyInn = 'empty';
  }

  #url;
  #token;
  #options;
  #inputs;

  async loadPartyData(query, count = 6) {
      return fetch(this.#url, {...this.#options, body: JSON.stringify({ query, count })})
             .then(response => response.json())
             .catch(err => console.log(err));

  }

  hidePartyOptions() {
    this.#inputs.partyOptions.style.display = 'none';
    this.#inputs.partyOptions.innerHTML = "";
  }

  createOption(op){
    const el = document.createElement('p');
    el.innerText = op ? op.value : 'Нет данных';
    el.setAttribute("data-inn", op ? op.data.inn : this.emptyInn);
    return el;
  }

  showPartyOptions(suggestions) {
    this.hidePartyOptions();

    if (suggestions.length === 0) suggestions.push(null);
    suggestions.forEach(s => {
      this.#inputs.partyOptions.appendChild(this.createOption(s));
    });
    this.#inputs.partyOptions.style.display = 'block';   
  }

  fillInputs(option) {
    this.hidePartyOptions();

    this.#inputs.party.value = option.name.short_with_opf;
    this.#inputs.nameShort.value = option.name.short_with_opf;
    this.#inputs.nameFull.value = option.name.full_with_opf;
    this.#inputs.innKpp.value = `${option.inn} / ${option.kpp}`;
    this.#inputs.address.value = option.address.value;
  }

  connectedCallback() {
    this.#inputs.party.addEventListener('keyup', (async function (event) {
      const newSearch = this.#inputs.party.value;
      if(newSearch.length === 0) return this.hidePartyOptions();  
      const suggestions = (await this.loadPartyData(newSearch)).suggestions;
      this.showPartyOptions(suggestions); 
      if (event.key === 'Enter' && suggestions.length > 0) this.fillInputs(suggestions[0].data);
    }).bind(this));

    this.#inputs.partyOptions.addEventListener("click", (async function (event) {   
        const inn = event.target.getAttribute('data-inn');
        if(inn === this.emptyInn) return this.hidePartyOptions();
        const suggestions = (await this.loadPartyData(inn)).suggestions;
        this.fillInputs(suggestions[0].data);
    }).bind(this))
  }
});