// Tutorial from here: https://www.youtube.com/watch?v=oKM2nQdQkIU

// Stores the words and clues
const Word_List = {
    "W1":["FANGS", "Pair of teeth"], 
    "W2":["ANIMAL", "Not a plant"],
    "W3":["APPLE", "One a day to keep the MDs away"],
    "W4":["FAKE", "Not real"],
    "W5":["VENOM", "Often mistaken for poison"],
    "W6":["SSS", "A hissing like sound"]
};

// Stores the central theme word
const ThemeWord = "SNAKES";

// QoL variables
// AlreadyWonFlag is a boolean that stores if someone has already won. If they have it stops reading keyboard commands and stops the popup from appearing. 
let AlreadyWonFlag = false; 

// Two constants which constrain the grid size. 
// Columns will probably always be fixed as the white space padding on either side doesn't matter.
// Number of rows is dependant on the size of the word list, so we just get that here.
const GridNumCols = 17;
const GridNumRows = Object.keys(Word_List).length;

// Two more variables which track where the cursor currently is
// These use let because we're gonna be reassigning them throughout the program
let CurrRow = 0; 
let CurrCol = 0; 

// One final variable which stores the reference column for the middle of the puzzle which never moves.
const MidCol = (GridNumCols-1)/2;

// Stores the game state
const state = {
    // Makes an empty array to store the game state.
    // This is equal to length of the longest word minus 1 in columns, and the number of words in rows.
    grid: Array(GridNumRows)
        .fill()
        // Fills the grid with no character. Could change to A to fill it to something else. 
        .map(() => Array(GridNumCols).fill('')),
    //Sets the current Row and Current Column to zero
    // >>>>>>>>>Commenting this out for now since I'm gonna try to reference this using the global constants
    // currentRow: 0, 
    // currentCol: 0, 
};

// Stores the box state
const boxtype = {
    // Makes an empty array to store the box type.
    // This is equal to length of the longest word minus 1 in columns, and the number of words in rows.
    grid: Array(GridNumRows)
        .fill()
        // Fills the grid with no character. Could change to A to fill it to something else. 
        .map(() => Array(GridNumCols).fill('')),
    //Sets the current Row and Current Column to zero
    // Also commenting out this block as in the state const
    // currentRow: 0, 
    // currentCol: 0, 
};

// Startup function. 
function startup(){
    //alert('TEST');
    // console.log(Word_List.W1[0].length);
    // I believe this retrieves the parameters for the game for the style.css file. 
    const game = document.getElementById('game');
    drawGrid(game);
    drawClues(clue);

    // Tesitng the updateGrid function.
    // boxtype.grid[0][7] = "empty";
    // state.grid[1][7] = "A";
    updateGrid();

    // Gets what the user is pressing.
    registerKeyboardEvents();

    // Reveals what the secret word to guess is in the console log
    // console.log(state.secret);

}

// Creates the main grid, but drawing boxes
function drawGrid(container){
    // Not entirely sure what this line is doing besides centering everything again?
    const grid = document.createElement('div');
    grid.className = 'grid';

    
    for (let i = 0; i < GridNumRows; i++){
        // Getting the current key to retrieve the crossword for this row.
        const key = Object.keys(Word_List)[i];
        // This retrieves the corresponding word in this row, and gets it's length.
        // Used to determine where a word will start relative to the middle, and also constrain which boxes are coloured at the start.
        const WordLen = Word_List[key][0].length;
        // Random function to determine the starting postiion of the word.
        // Math.random() gives a value from 0-1 so we multiple this by WordLen and then strip decimals to get an index.
        const start = Math.floor(Math.random()*WordLen);

        // Catching the first instance through here to set the starting position of the cursor to first letter in the first row.
        if (i == 0){
            CurrRow = 0;
            // I think this gives me a value that is one greater than I need so I'm subtracting one here from the final.
            // Undoing the minus one since I think it's actually not zero indexed.
            CurrCol = MidCol-start;
        }
        // console.log(CurrRow, CurrCol);
        // console.log(start);
        for (let j = 0; j < GridNumCols; j++){
            // The if statments are used to colour the boxes. 
            // First we check if its in the middle where the theme word is, and colour those
            if (j == MidCol){
                boxtype.grid[i][j] = "middle";
                drawBox(grid, i, j);
            }
            // If not then check if the word for each row is due to start in those boxes and colour those.
            else if (j >= (MidCol-start) && j <= (MidCol+(WordLen-start-1))){
                boxtype.grid[i][j] = "word";
                drawBox(grid, i, j);
            }
            // Barring all that we're drawing an empty box with no border (essentially invisible), so command the drawBox() function to draw that.
            else{
                boxtype.grid[i][j] = "empty";
                drawBox(grid, i, j);
            }
            // console.log(boxtype.grid[i]);

        }
    }

    // Adding a line here setting the starting box to active
    boxtype.grid[CurrRow][CurrCol] = "active";

    container.appendChild(grid); 
}

// Draws a box with nothing inside of it. 
// We draw one of three boxes depending on the drawGrid() function above.
//  Either an empty invisible box ("empty")
//  A box in the middle that holds the theme ("middle")
//  A box that holds space for the word in that row.
function drawBox(container, row, col, letter=''){
    // Still unsure what this does.
    const box = document.createElement('div');
    // Also unsure what this does unless it's necessary to specify a parent class so we can add subclasses later.
    box.className='box';
    // Gives the box an ID based on it's position
    box.id=`box${row}${col}`;
    //Fills it with nothing
    box.textContent=letter;
    // Gives the box an additinal class if it shouldn't be invisible.
    // Couldn't figure out how to incorporate this with the Update Box function so have a duplicate of those lines below.
    if (boxtype.grid[row][col] == "middle"){
        box.classList.add('right');
        box.classList.remove('wrong');
    }
    else if (boxtype.grid[row][col] == "word"){
        box.classList.add('wrong');
        box.classList.remove('right');
    }
    else if (boxtype.grid[row][col] == "empty"){
        box.classList.remove('right');
        box.classList.remove('wrong');
    }
    container.appendChild(box);
    return box;
}

// Function to draw a box for the clues
function drawClues(container){
    // I'm pretty sure this just makes a new element and searches the html and css for the respective styles
    const ClueBox = document.createElement('div');
    ClueBox.className = 'ClueBox';
    ClueBox.id=`ClueBox`

    // This draws the first clue in the box.
    ClueBox.textContent = Word_List.W1[1];
    container.appendChild(ClueBox);
}

// This updates the grid and sets the text content of them to whatever is currently in the game state array
// Not sure if I'm going to need to also update the positions of the visible boxes here??
// Will definetly need to update the boxes here.
// Don't think I need to actually change the IDs here just update what it's pulling from.
function updateGrid(){
    for (let i = 0; i< state.grid.length; i++){
        for (let j = 0; j < state.grid[i].length; j++) {
            UpdateBox(i, j);
        }
    }
    // This updates the clue to match the current row.
    ClueBox.textContent = Word_List[(Object.keys(Word_List)[CurrRow])][1];
}

// Writing a new function to update the boxtype
// This updates the text in the box (from state.grid) and the colour of the box (from boxtype.grid)
function UpdateBox(row, col){
    const box = document.getElementById(`box${row}${col}`); 
    box.textContent=state.grid[row][col];
    if (boxtype.grid[row][col] == "middle"){
        box.classList.add('right');
        box.classList.remove('wrong');
        box.classList.remove('active');
    }
    else if (boxtype.grid[row][col] == "word"){
        box.classList.add('wrong');
        box.classList.remove('right');
        box.classList.remove('active');
    }
    else if (boxtype.grid[row][col] == "empty"){
        box.classList.remove('right');
        box.classList.remove('wrong');
        box.classList.remove('active');
    }
    if (boxtype.grid[row][col] == "active"){
        box.classList.remove('right');
        box.classList.remove('wrong');
        box.classList.add('active');
    }
}


function registerKeyboardEvents(){
    document.body.onkeydown = (e) => {

        // e is the event object. 
        // This essentially gets what key was pushed.
        const key = e.key; 

        // Using the flag here to disable keyboard events if the player has already won.
        if (AlreadyWonFlag ==false){
            // Preforming checks for various keys. 
            // First checking for backspace which will call a function to delete the previous letter.
            if (key == 'Backspace'){
                removeLetter(); 
            }
            // Might also consider adding a delete key here.

            // Checking if the down arrow key is pressed which shifts the active focus to another row.
            if (key == 'ArrowDown'){
                MoveDown(); 
            }
            // Checking if the up arrow key is pressed which shifts the active focus to another row.
            if (key == 'ArrowUp'){
                MoveUp(); 
            }
            // Functions to shift the current row to the right
            if (key == 'ArrowRight'){
                MoveRight(); 
            }
            // Or to shift it to the left.
            if (key == 'ArrowLeft'){
                MoveLeft(); 
            }
            // Lastly checks to see if a letter is pressed (using the isLetter function), and adds it to the current word.
            if (isLetter(key)){
                addLetter(key); 
            }
        }


        // After capturing the keystroke and making the requisite changes, we update the grid which resets the colouring and text contents.
        updateGrid(); 
        // Then we check if the person has correctly solved all the clue puzzles and the central theme word
        isWinner(); 
    }
}

// Removes a letter from the grid
function removeLetter(){
    //Checks if the current cursor position is in the leftmost column or if the box immediately to the left is empty (i.e. not active)
    // If either is true then does nothing
    if (CurrCol === 0 || boxtype.grid[CurrRow][CurrCol-1] == "empty"){
        return; 
    }
    else if (state.grid[CurrRow][CurrCol] != ""){
        state.grid[CurrRow][CurrCol] = '';
    }
    else {
        // Else, if there is something to delete sets the current character to an empty string (note this is actually the preceding character since focus shifts after typing.)
        state.grid[CurrRow][CurrCol-1] ='';
        boxtype.grid[CurrRow][CurrCol] = "word";

        ResetBoxState();

        // Changing the position of the current curosr
        CurrCol--;
        boxtype.grid[CurrRow][CurrCol] = "active";
    }
}

// Function to determine if the pressed key was a letter or not.
function isLetter(key){
    // Checks if the length is equal to 1 and matches a regex for a-z characters
    return key.length === 1 && key.match(/[a-z]/i);
}

// Adds a letter to the grid
function addLetter(letter){
    // Adds the character to the word and sets the field. 
    // Converting this to upper case here otherwise the matches in winner don't work as they're case sensitive
    state.grid[CurrRow][CurrCol] = letter.toUpperCase();

    // Checks if the current row has any space left or if you are in the last column
    if (CurrCol === (GridNumCols-1) || boxtype.grid[CurrRow][CurrCol+1] == "empty"){
        return;
    } 
    else {
        ResetBoxState(); 
        // Increments the column number by 1
        CurrCol++; 
        boxtype.grid[CurrRow][CurrCol] = "active";
    }
}

// Function which drops the current cursor to the next row
function MoveDown(){
    // console.log(CurrRow, GridNumRows);
    // Check if we're currently in the last row. If so do nothing.
    if (CurrRow+1 >= GridNumRows){
        return;
    }
    // If not start the process to move down a row.
    else {
        // Reset the box state
        ResetBoxState(); 

        // Set the column equal to the first box that's in the word or in the middle, and increment row by 1.
        // Then update the current box to active.
        CurrCol = boxtype.grid[CurrRow+1].findIndex(pos => pos === 'word' || pos === 'middle');
        CurrRow++;
        boxtype.grid[CurrRow][CurrCol] = "active";
        // console.log(CurrRow, CurrCol);
    }
}

// Opposite of the MoveDown() function. Moves the current curosor up to the previous row.
function MoveUp(){
    // console.log(CurrRow, GridNumRows);
    // Check if we're currently in the first row. If so do nothing.
    if (CurrRow <= 0){
        return;
    }
    // If not start the process to move down a row.
    else {
        // Reset the box state
        ResetBoxState(); 

        // Set the column equal to the first box that's in the word or in the middle, and increment row by 1.
        // Then update the current box to active.
        CurrCol = boxtype.grid[CurrRow-1].findIndex(pos => pos === 'word' || pos === 'middle');
        CurrRow--;
        boxtype.grid[CurrRow][CurrCol] = "active";
        // console.log(CurrRow, CurrCol);
    }
}

// Shifts the current row one box to the right
function MoveRight(){
    // Checking if there is some of the word to the right of the middle or not. If yes doing the stuff inside else returning nothing.
    // Note we also have to check if the index of the active cell is less than middle for the case where there's only 1 space in front of the middle.
    // Finally we also have an annoying condition where the active cell obscures the middle column, so we have to check if there's still word cells to the left of the active cell and the middle column is obscured
    if ((boxtype.grid[CurrRow].findIndex(pos => pos === 'word' || pos === "active") <  boxtype.grid[CurrRow].findIndex(pos => pos === 'middle')) || ((boxtype.grid[CurrRow].findIndex(pos => pos === 'word') <  boxtype.grid[CurrRow].findIndex(pos => pos === 'active')) && (boxtype.grid[CurrRow].findIndex(pos => pos === 'middle') == -1))){
        // Reseting the box states
        ResetBoxState();

        // Moving everything over ont to the right.
        // Notes this runs from the right to the left otherwise we overwrite the entries we're trying to move.
        for (let i = GridNumCols-1; i > boxtype.grid[CurrRow].findIndex(pos => pos === 'word'|| pos === "active"); i--){
            // console.log(i, boxtype.grid[CurrRow].findIndex(pos => pos === 'word'));
            if (boxtype.grid[CurrRow][i-1] == "word" || boxtype.grid[CurrRow][i-1] == "middle"){
                boxtype.grid[CurrRow][i] = "word";
                state.grid[CurrRow][i] = state.grid[CurrRow][i-1];
            }
            // Removing the contents of the previous grid/cell. This only needs to happen once at the very end, but javascript doesn't seem to like letting i live outside the loop.
            state.grid[CurrRow][i-1] = '';
            boxtype.grid[CurrRow][i-1] = 'empty';
        }
        // Reseting the middle space.
        boxtype.grid[CurrRow][MidCol] = "middle";

        // Advancing the column by 1 and setting the new active cell.
        CurrCol++; 
        boxtype.grid[CurrRow][CurrCol] = "active";

    }
    else {
        return;
    }
}

// Shifts the current row one box to the left
function MoveLeft(){
    // Checking if there is some of the word to the right of the middle or not. If yes doing the stuff inside else returning nothing.
    // We're doing this slightly differently than above since we have to use another function to look at the end of the word - lastIndexOf()
    // This doesn't allow for multiple queries at once so have to use an or statment below. 
    // Note if middle is currently obscured by the active cell it returns a value of -1 so the statment below is true.
    if ((boxtype.grid[CurrRow].lastIndexOf('word') >  boxtype.grid[CurrRow].lastIndexOf('middle')) || (boxtype.grid[CurrRow].lastIndexOf('active') > boxtype.grid[CurrRow].lastIndexOf('middle'))){
        //However, the value of -1 for middle is not good, so we check here if there is still more of the word to the right of the active cell. 
        if ((boxtype.grid[CurrRow].lastIndexOf('middle') != -1) || boxtype.grid[CurrRow].lastIndexOf('word') >  boxtype.grid[CurrRow].lastIndexOf('active')){
            // Reseting the box states
            ResetBoxState();
            
            // Since last index of doesn't seem to take multiple arguments storing the larget of the two values in the variable below
            let LoopLimit = Math.max(boxtype.grid[CurrRow].lastIndexOf('word'), boxtype.grid[CurrRow].lastIndexOf('active'));

            // Moving everything over ont to the left.
            // Notes this runs from the left to right since we dont' need to worry about overwriting the next entry.
            for (let i = 0; i < LoopLimit; i++){
                // Checking if the next box had a type of word or middle, if so we inherit word, and the letter in that box. Otherwise we do nothing.
                if (boxtype.grid[CurrRow][i+1] == "word" || boxtype.grid[CurrRow][i+1] == "middle"){
                    boxtype.grid[CurrRow][i] = "word";
                    state.grid[CurrRow][i] = state.grid[CurrRow][i+1];
                }
                // Removing the contents of the next grid/cell. This only needs to happen once at the very end, but javascript doesn't seem to like letting i live outside the loop.
                state.grid[CurrRow][i+1] = '';
                boxtype.grid[CurrRow][i+1] = 'empty';
            }
            // Reseting the middle space.
            boxtype.grid[CurrRow][MidCol] = "middle";

            // Dropping the column by 1 and setting the new active cell.
            CurrCol--; 
            boxtype.grid[CurrRow][CurrCol] = "active";
        }
    }
    else {
        return;
    }
}

// Making a function here just to reset box state
function ResetBoxState(){
    // Sets the box the focus was in back to a word or middle box as appropriate.
    if (CurrCol == MidCol){
        boxtype.grid[CurrRow][CurrCol] = "middle";
    }
    else {
        boxtype.grid[CurrRow][CurrCol] = "word";
    }
}

// Function which checks if the puzzle is solved
// I might eventually modify this where if the words are correct, but the theme word is not (i.e. you need to move side to side), it'll trip a flag that disables text entry and maybe makes all letters another colour.
function isWinner(){
    // Storing a variable to catpure the central word. 
    // Note: we also evaluate that each row is correct while we recover the central word.
    let CentralWord = "";
    for (let i = 0; i < GridNumRows; i++){
        // Get the word in each row (empty strings are removed), and see if it matches the row entry in the word list.
        // If not return and do nothing.
        if (state.grid[i].reduce((prev, curr) => prev + curr) != Word_List[(Object.keys(Word_List)[i])][0]){
            return;
        }
        // If it does take the character in the central theme word and append it.
        else{
            CentralWord += state.grid[i][MidCol];
        }
    }
    // Checking to see if the central word is correct
    // Wrapping this in a timeout function set to 0.1s otherwise it prints the alert before the screen updates and freezes the update.
    setTimeout(() => {
        // Using the already won flag here 
        if (CentralWord == ThemeWord && AlreadyWonFlag == false){
            // Should set a flag to stop keyboard events alerts popping up after.
            AlreadyWonFlag = true;
            alert("Congratulation! You Win!");

        }
    },100);
}

// called here so that it runs on startup (i.e. not nested in something.)
startup();


