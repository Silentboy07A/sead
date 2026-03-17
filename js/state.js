/**
 * CinTic State Management Module
 */

export const SEAT_PRICES = { gold: 150, silver: 200, platinum: 300 };
export const GENRES = ["All", "Action", "Comedy", "Drama", "Horror", "Thriller", "Sci-Fi", "Romance"];

export const SNACKS = [
  { id: 'popcorn_reg', name: 'Salted Popcorn (R)', price: 180, image: 'assets/snacks/popcorn_salted.png', category: 'Snacks' },
  { id: 'popcorn_large', name: 'Cheese Popcorn (L)', price: 250, image: 'assets/snacks/popcorn_cheese.png', category: 'Snacks' },
  { id: 'coke', name: 'Coca Cola (500ml)', price: 120, image: 'assets/snacks/coca_cola.png', category: 'Beverages' },
  { id: 'nachos', name: 'Loaded Nachos', price: 210, image: 'assets/snacks/loaded_nachos.png', category: 'Snacks' },
  { id: 'burger', name: 'Chicken Burger', price: 190, image: 'assets/snacks/chicken_burger.png', category: 'Snacks' },
  { id: 'combo1', name: 'Couple Combo', price: 450, desc: '2 Large Popcorn + 2 Coke', image: 'assets/snacks/snack_combo.png', category: 'Value Combos' }
];

const initialState = {
  user: null,
  movies: [],
  theatres: [],
  selectedMovie: null,
  selectedTheatre: null,
  selectedShow: null,
  selectedSeats: [],
  selectedSnacks: {}, // { snackId: quantity }
  takenSeats: [], 
  lockedSeats: [], 
  lockExpires: null,
  lockInterval: null,
  activePersona: 'Cinephile'
};

/**
 * Observable State Store
 */
class Store {
  constructor(initial) {
    this.state = { ...initial };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  /**
   * Update state and notify listeners
   * @param {Object} newState 
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener 
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const stateStore = new Store(initialState);
export default stateStore;
