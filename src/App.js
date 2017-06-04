import React, { Component } from 'react';
import './App.css';

/* TODO:

  -Styling
  -Definere hvilke properties som kreves
  -Namespaces/hjelpeklasser for sumIngoing/sumOutgoing
  -Flytte mine komponenter til egne mapper/filer

  Hvis man skal bli fancy:
    -Redux på tilstand
    -RxJS
    -Tester
    (Kanskje gjøre disse to i et senere eksperiment)
*/

const apiUrl = 'http://skbank.azurewebsites.net/api/transaksjon';
const categoriesUrl = 'http://skbank.azurewebsites.net/api/kategori';

function sumIngoingTransactionsInSelectedCategory(transactions, categoryFilter) {
    let sum = 0;
    for (var i = 0 ; i < transactions.length; i++) {
      if (categoryFilter != 0 && transactions[i].kategoriID != categoryFilter) {
        continue;
      }

      var amount = transactions[i].beloep;
      if (amount > 0) {
        sum += amount;
      }
    }
    return sum;
}

function sumOutgoingTransactionsInSelectedCategory(transactions, categoryFilter) {
    let sum = 0;
    for (var i = 0 ; i < transactions.length; i++) {
      if (categoryFilter != 0 && transactions[i].kategoriID != categoryFilter) {
        continue;
      }

      var amount = transactions[i].beloep;
      if (amount < 0) {
        sum += -amount;
      }
    }
    return sum;
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      accountName: '',
      amount: null,
      transactions: [],
      categories: [{kategoriID: 3, beskrivelse: "test"}],
      categoryFilter: 0 // Display all by default
    }
  }

  render() {
    return (
      <div>
        <SaldoBox accountName={this.state.accountName}
                  amount={this.state.amount}
                  setFilterCallback={this.setCategoryFilter}
                  categories={
                    this.getOnlyCategoriesThatHaveTransactions(
                      this.state.categories, 
                      this.state.transactions)}
                   />

        <TransactionsBox transactions={this.state.transactions}
                         categoryFilter={this.state.categoryFilter} />
      </div>
    );
  }

  componentDidMount() {
    fetch(apiUrl)
      .then(response => { return response.json() })
      .then(json => { 
        this.setState({
          accountName: json.kontonavn,
          amount: json.saldo,
          transactions: json.transaksjoner
        });
      });

    fetch(categoriesUrl)
      .then(response => { return response.json() })
      .then(json => { 
        this.setState({
          categories: json
        });
      });
  }

  setCategoryFilter = (filterIndex) => {
    this.setState({categoryFilter: filterIndex});
  }

  getOnlyCategoriesThatHaveTransactions = (allCategories, transactions) => {
    let result = []
    for (var i = 0 ; i < allCategories.length ; i++) {
      for (var k = 0 ; k < transactions.length ; k++) {
        if (transactions[k].kategoriID === allCategories[i].kategoriID) {
          result.push(allCategories[i]);
          break;
        }
      }
    }
    return result;
  }
}

class SaldoBox extends Component {
  render() {
    return (
      <div className="saldoBox">
        <h3>{this.props.accountName}</h3>
        <p>Saldo: {this.props.amount} kr</p>
        <CategorySelector categories={this.props.categories}
                          setFilterCallback={this.props.setFilterCallback} />
      </div>
    )
  }
}

class TransactionsBox extends Component {
  render() {
    return (
      <div className="transactionsBox">
        <h3>Transaksjoner</h3>
        <table>
          <thead>
            <tr>
              <th>Dato</th>
              <th>Beskrivelse</th>
              <th>Inn</th>
              <th>Ut</th>
            </tr>
          </thead>
          <tbody>
            {
              this.props.transactions.map(t => 
                this.props.categoryFilter == 0 || this.props.categoryFilter == t.kategoriID ?
                  this.tableRowWithTransactionDetails(t)
                  : null)
            }
          </tbody>
        </table>
        <h4>Sum inn: {
          sumIngoingTransactionsInSelectedCategory(
            this.props.transactions, 
            this.props.categoryFilter).toFixed(2)} kr</h4>
        <h4>Sum ut: {
          sumOutgoingTransactionsInSelectedCategory(
            this.props.transactions, 
            this.props.categoryFilter).toFixed(2)} kr</h4>
      </div>
    )
  }

  tableRowWithTransactionDetails = (transaction) => {
    let ingoingAmountWithTwoDigits = (transaction.beloep > 0) ? transaction.beloep.toFixed(2) : '';
    let outgoingAmountWithTwoDigits = (transaction.beloep < 0) ? -transaction.beloep.toFixed(2) : '';

    return (
      <tr key={transaction.transaksjonsID}>
        <td>{transaction.dato.substring(0, 10)}</td>
        <td>{transaction.beskrivelse}</td>
        <td>{ingoingAmountWithTwoDigits}</td>
        <td>{outgoingAmountWithTwoDigits}</td>
      </tr>);
  }
}

class CategorySelector extends Component {
  constructor(props) {
    super(props);
    this.handleDropdownChanged = this.handleDropdownChanged.bind(this);
  }

  render() { 
    return (
      <select onChange={this.handleDropdownChanged}>
        <option value='0' key='0'>Vis alle kategorier</option>
        {
          this.props.categories.map(c => 
            <option value={c.kategoriID} key={c.kategoriID}>{c.beskrivelse}</option>
        )}
      </select>
    )}

  handleDropdownChanged(e) {
    this.props.setFilterCallback(e.target.value);
  }
}

export default App;
