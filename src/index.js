// Tutorial from here: https://www.youtube.com/watch?v=oKM2nQdQkIU

// Importing some packages to make this whole thing pretty
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11.16.0/+esm';

// Importing the puzzle parameters
import { Puzzle_Word_List, Puzzle_ThemeWord, Puzzle_Author, Previous_Meso} from './Puzzle.js';

// Setting variables to the imported puzzle parameters
// The Word list which contains the crossword words and puzzles
// The ThemeWord which contains the central word the individual words are related to.
const Word_List = Puzzle_Word_List;
const ThemeWord = Puzzle_ThemeWord;
const Author = Puzzle_Author; 
const Previous_Word = Previous_Meso; 

// Writing the puzzle author to the page.
document.getElementById('Author').innerHTML="Puzzle By: " + Author;

// --- QoL variables ---
// AlreadyWonFlag is a boolean that stores if someone has already won. If they have it stops reading keyboard commands and stops the popup from appearing. 
let AlreadyWonFlag = false; 

// Setting two variables to deal with dates for cookie expiration
// The first is just today's date.
// Expiration date is originally just today's date, but then get's icremented by 1 (effiectively 1 year from today)
const DateToday = new Date(); 
const OneYearFromNow = new Date(DateToday);
OneYearFromNow.setFullYear(OneYearFromNow.getFullYear()+1);
const CookieExpirationDate = "expires=" + OneYearFromNow.toUTCString();

// Setting a tracker for if a hint has been used or not
let HintsUsed = 0;

// Declaring an empty object to store to store cookies.
const CookieState = {};

// --- QoL variable end ---

// Two constants which constrain the grid size. 
// Columns will probably always be fixed as the white space padding on either side doesn't matter.
// Number of rows is dependant on the size of the word list, so we just get that here.
const GridNumCols = 17;
const GridNumRows = Object.keys(Word_List).length;

// Two more variables which track where the cursor currently is
// These use let because we're gonna be reassigning them throughout the program
let CurrRow = 0; 
let CurrCol = 0; 

// Creating a 1D array which stores if the word in that row is correct (1) or wrong (0). Starting this with 10, then setting the length of it equal to the number of rows in the puzzle.
let CorrectRow = [0,0,0,0,0,0,0,0,0,0];
CorrectRow.length = GridNumRows;


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

// This defines and adds an onscreen custom keyboard so we don't have to use the default mobile ones which take up a lot of room.
let Keyboard = window.SimpleKeyboard.default;
const defaultTheme = "hg-theme-default";
const keyboard = new Keyboard({
    theme: defaultTheme,
    // Defining a custom layout without any keys that we don't need.
    layout:{
        default: [
            "Q W E R T Y U I O P",
            "A S D F G H J K L",
            "Z X C V B N M {backspace}",
            "{arrowleft} {arrowright}" 
        ]
    },
    buttonTheme: [
        {
            class: "Bksp-Key",
            buttons: "{backspace}"
        },
        {
            class: "Other-Keys",
            buttons: "Q W E R T Y U I O P A S D F G H J K L Z X C V B N M"
        }
    ],
    // Setting custom display for the backspace key.
    display: {
        "{backspace}" : "← Backspace ",
        "{arrowleft}" : "← Left",
        "{arrowright}" : "Right →"
    },
    // Calls a reduced function for dealing with the mobile keyboard.
    // No arrow keys so we only care about adding or removing leters. 
    onKeyPress: button => onKeyPress(button)
});

// Function which adds a class to the keyboard that makes it appear on smaller screens.
// On desktops this does nothing, because the class that it adds is formatted at that breakpoint to hide the keyboard anyways.
function showKeyboard() {
    keyboard.setOptions({
        theme: `${defaultTheme} show-keyboard`
    });
}
// Function that removes that class and effectively hides it.
function hideKeyboard() {
    keyboard.setOptions({
        theme: defaultTheme
    });
}

// Startup function. 
function startup(){
    // I believe this retrieves the parameters for the game for the style.css file. 
    const game = document.getElementById('game');

    drawGrid(game);
    drawClues(clue);

    // Adding a function here to drop starting cookies on an users computer which we use to show/not show some popups.
    GetCookies();

    // Adding a function here to welcome first time users and direct them to the help menu
    FirstTime(); 

    // Tesitng the updateGrid function.
    updateGrid();

    // Gets what the user is pressing.
    registerKeyboardEvents();
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
        if (CorrectRow[row] == 1){
            box.classList.add('right-correct');
            box.classList.remove('right');
            box.classList.remove('wrong');
            box.classList.remove('active');
            box.classList.remove('wrong-correct');
            box.classList.remove('active-correct');
        }
        else {
            box.classList.add('right');
            box.classList.remove('right-correct');
            box.classList.remove('wrong');
            box.classList.remove('active');
            box.classList.remove('wrong-correct');
            box.classList.remove('active-correct');
        }
    }
    else if (boxtype.grid[row][col] == "word"){
        if (CorrectRow[row] == 1){
            box.classList.add('wrong-correct');
            box.classList.remove('right');
            box.classList.remove('wrong');
            box.classList.remove('active');
            box.classList.remove('right-correct');
            box.classList.remove('active-correct');

        }
        else {
            box.classList.add('wrong');
            box.classList.remove('right');
            box.classList.remove('active');
            box.classList.remove('right-correct');
            box.classList.remove('wrong-correct');
            box.classList.remove('active-correct');
        }
    }
    else if (boxtype.grid[row][col] == "empty"){
        box.classList.remove('right');
        box.classList.remove('wrong');
        box.classList.remove('active');
        box.classList.remove('right-correct');
        box.classList.remove('wrong-correct');
        box.classList.remove('active-correct');
    }
    if (boxtype.grid[row][col] == "active"){
        if (CorrectRow[row] == 1){
            box.classList.add('active-correct');
            box.classList.remove('right');
            box.classList.remove('wrong');
            box.classList.remove('active');
            box.classList.remove('right-correct');
            box.classList.remove('wrong-correct');
        }
        else {
            box.classList.add('active');
            box.classList.remove('right');
            box.classList.remove('wrong');
            box.classList.remove('right-correct');
            box.classList.remove('wrong-correct');
            box.classList.remove('active-correct');
        }
    }
}

// Function for adding/removing letters using the mobile keyboard.
function onKeyPress(Button){
    // Adding the main function from the register keyboard events function here for dealing with the mobile keyboard.
    // Adding also the left and right arrow keys if people would prefer to use them. 
    if (AlreadyWonFlag ==false){
        // Preforming checks for various keys. 
        // First checking for backspace which will call a function to delete the previous letter.
        // Also adding a check here to see if the current row has the correct word (CorrectRow[CurrRow] != 1). If so I disable editing the text of that row.
        if (Button == '{backspace}' && CorrectRow[CurrRow] != 1){
            removeLetter(); 
        }
        if (Button == '{arrowright}'){
            MoveRight(); 
        }
        // Or to shift it to the left.
        if (Button == '{arrowleft}'){
            MoveLeft(); 
        }
        // Checks to see if a letter is pressed (using the isLetter function), and adds it to the current word.
        // Also adding a check here to see if the current row has the correct word (CorrectRow[CurrRow] != 1). If so I disable editing the text of that row.
        if (isLetter(Button) && CorrectRow[CurrRow] != 1){
            addLetter(Button); 
        }
    }

    // Then we check if the person has correctly solved all the clue puzzles and the central theme word
    isWinner(); 
    // After capturing the keystroke and making the requisite changes, we update the grid which resets the colouring and text contents.
    updateGrid(); 
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
            // Also adding a check here to see if the current row has the correct word (CorrectRow[CurrRow] != 1). If so I disable editing the text of that row.
            if (key == 'Backspace' && CorrectRow[CurrRow] != 1){
                removeLetter(); 
            }
            // Might also consider adding a delete key here.

            // Checking if the down arrow key is pressed which shifts the active focus to another row.
            if (key == 'ArrowDown' || key == 'Tab'){
                // Prevents the tab key from moving around the rest of the window. 
                if (key == 'Tab'){
                    e.preventDefault();
                }
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
            // Also adding a check here to see if the current row has the correct word (CorrectRow[CurrRow] != 1). If so I disable editing the text of that row.
            if (isLetter(key) && CorrectRow[CurrRow] != 1){
                addLetter(key); 
            }
        }

        // Then we check if the person has correctly solved all the clue puzzles and the central theme word
        isWinner(); 
        // After capturing the keystroke and making the requisite changes, we update the grid which resets the colouring and text contents.
        updateGrid(); 

    }
}

// Removes a letter from the grid
function removeLetter(){
    // Checking for two niche cases where the backspace breaks:
    // First if statment checks if the current box is empty and it's in the very first column. Deleting here would cause it to jump off the grid.
    if (state.grid[CurrRow][CurrCol] == "" && CurrCol ==  0){
        return; 
    }
    // Second checks if the current active box is the leftmost active box in the row and the box immediately to the left is hidden. If so also does nothing. 
    else if (state.grid[CurrRow][CurrCol] == "" && boxtype.grid[CurrRow][CurrCol-1] == "empty"){
        return; 
    }
    // Else if there's something in the current box it just deletes it and leaves the active box where it is. 
    else if (state.grid[CurrRow][CurrCol] != ""){
        state.grid[CurrRow][CurrCol] = '';
    }
    // If there was nothing in the box then it deletes the entry of the previous box and sets the focus there. 
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
    if (CurrCol == (GridNumCols-1) || boxtype.grid[CurrRow][CurrCol+1] == "empty"){
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
    }
}

// Opposite of the MoveDown() function. Moves the current curosor up to the previous row.
function MoveUp(){
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
            CorrectRow[i] = 0;
            // return;
        }
        // If it does take the character in the central theme word and append it.
        else{
            CorrectRow[i] = 1;
            CentralWord += state.grid[i][MidCol];
        }
    }
    // Calling a function here to alert the user that 
    if (CorrectRow.includes(0) == false && CookieState["FirstTimeHint"]  == "true"){
        // Making a popup here that only appears the first time the user plays to tell them to rearrange the words.
        Swal.fire({
            position: "top-end",
            imageUrl: "./src/Assets/Linkr_LeftToRight.png",
            title: "Well Done",
            padding: "3em",
            confirmButtonColor: "Green",
            confirmButtonText: "Back to Game",
            text: 'Almost there. Now move the rows left and right to align and reveal the vertical word that links all the words together. Remember all the words are related to the hidden vertical word!',
            backdrop: 'rgba(212, 233, 214, 0.4)'
          })
        // Setting a cookie so this doesn't display again.
        document.cookie = `FirstTimeHint=false; ${CookieExpirationDate}; path=/`;
        CookieState["FirstTimeHint"]  = "false";
    }
    else if (CorrectRow.includes(0) == false && CookieState["FirstTimeHint"]  == "false"){
        document.cookie = `FirstTimeHint=false; ${CookieExpirationDate}; path=/`;
    }

    // Removing the event listeners for mouse movement and touchscreen dragging here to prevent sliding once the MESO is complete.

    // Checking to see if the central word is correct
    // Wrapping this in a timeout function set to 0.1s otherwise it prints the alert before the screen updates and freezes the update.
    setTimeout(() => {
        // Using the already won flag here 
        if (CentralWord == ThemeWord && AlreadyWonFlag == false){
            // Should set a flag to stop keyboard events alerts popping up after.
            AlreadyWonFlag = true;

            // Checking streak stuff
            if (CookieState["PreviousWord"] == Previous_Word){
                // Gets the value of streak and adds 1 to it. Wrapping this in a number here so it adds it as numbers. 
                let streakcount = Number(CookieState["Streak"])+1;
                CookieState["Streak"] = streakcount;
                document.cookie = `Streak=${streakcount}; ${CookieExpirationDate}; path=/`;
                
                // Checking if hints were used or not.
                // If not then increasing the value of perfect streak as well.
                if (HintsUsed == 0){
                    let PerfectRun = Number(CookieState["PerfectStreak"])+1;
                    CookieState["PerfectStreak"] = PerfectRun; 
                    document.cookie = `PerfectStreak=${PerfectRun}; ${CookieExpirationDate}; path=/`;
                }
            }
            // If the word stores as a cookie is not equal to the previous word this means the person has missed the puzzle. 
            // As such we reset streak to one. 
            // Also need to check that's its not equal to the current word in case someone redoes it so that it doesn't wipe their streak.
            else if (CookieState["PreviousWord"] != Previous_Word && CookieState["PreviousWord"] != ThemeWord){
                // Don't need to consider a scenerio where this is won or not since these if statments will only trigger on a win.
                document.cookie = `Streak=1; ${CookieExpirationDate}; path=/`;
                CookieState["Streak"] = 1;

                // Checking if hints were used or not. 
                if (HintsUsed == 0){
                    // Again, impossible to get a perfect puzzle without completing one, so we can just set this to one.
                    CookieState["PerfectStreak"] = 1; 
                    document.cookie = `PerfectStreak=1; ${CookieExpirationDate}; path=/`;
                }
                else if (HintsUsed > 0){
                    CookieState["PerfectStreak"] = 0; 
                    document.cookie = `PerfectStreak=0; ${CookieExpirationDate}; path=/`;
                }
            }
            
            // Setting a cookie to remember the middle word of the last puzzle solved
            // This happens irrespective of whether this is a streak or not yet.
            document.cookie = `PreviousWord=${ThemeWord}; ${CookieExpirationDate}; path=/`;
            
            // Displays the winner popup.
            WinDisplay(HintsUsed);

        }
    },100);
}
function WinDisplay(HintFlag){

    // Calling the confetti cannon function
    ConfettiCanon();

    // Hiding the onscreen keyboard if necessary.
    hideKeyboard();

    if (HintFlag == 0){
        // Makes a fancier alert box using sweetalerts2
        Swal.fire({
            imageUrl: "./src/Assets/WinnerCrown.png",
            padding: "3em",
            html: `Winner! And a perfect puzzle no less! <br />MESO-merizing!<br /><br /> Current Streak: ${CookieState["Streak"]} <br /> Perfect Puzzles in Streak: ${CookieState["PerfectStreak"]} <br /> <br /> New puzzles every weekday between 9-10am EST!`,
            confirmButtonText: 'Thanks For Playing',
            backdrop: 'rgba(212, 233, 214, 0.1)'
        })
    }
    else if (HintFlag > 0 && HintFlag < 2){
        Swal.fire({
            imageUrl: "./src/Assets/WinnerCrown.png",
            padding: "3em",
            html: `Winner! And with only one hint! Congratulations! <br /><br /> Current Streak: ${CookieState["Streak"]} <br /> Perfect Puzzles in Streak: ${CookieState["PerfectStreak"]} <br /> <br /> New puzzles every weekday between 9-10am EST!`,
            confirmButtonText: 'Thanks For Playing',
            backdrop: 'rgba(212, 233, 214, 0.1)'
        })
    }
    else if (HintFlag > 1){
        Swal.fire({
            imageUrl: "./src/Assets/WinnerCrown.png",
            padding: "3em",
            html: `Winner! Cogratulations! <br /> Hints Used: ${HintFlag}<br /> Current Streak: ${CookieState["Streak"]} <br /> Perfect Puzzles in Streak: ${CookieState["PerfectStreak"]} <br /> <br /> New puzzles every weekday between 9-10am EST!`,
            confirmButtonText: 'Thanks For Playing',
            backdrop: 'rgba(212, 233, 214, 0.1)'
        })
    }

}

function ConfettiCanon(){
    // Parameters for the confetti package from tsparticles confetti.
    confetti("tsparticles", {
        angle: 90,
        // This controls the amount of particles produced.
        count: 100,
        // This sets the start position (right now roughly aligned with the title.)
        position: {
            x: 50,
            y: 5,
        },
        // Controls the spread. In this case it's a point explosion outwards into a circle.
        spread: 360,
        startVelocity: 45,
        decay: 0.9,
        gravity: 1,
        drift: 30,
        // Sets the time to fade (smaller values keep the images around longer).
        ticks: 100,
        shapes: ["image"],
        // Sets the images for the confetti
        shapeOptions: {
            image: [{
                src: "./src/Assets/TILES_Green_E.png",
                width: 100,
                height: 100,
                },
                {
                src: "./src/Assets/TILES_Green_M.png",
                width: 100,
                height: 100,
                },
                {
                src: "./src/Assets/TILES_Green_O.png",
                width: 100,
                height: 100,
                },
                {
                src: "./src/Assets/TILES_Green_S.png",
                width: 100,
                height: 100,
                },
                {
                src: "./src/Assets/TILES_White_E.png",
                width: 100,
                height: 100,
                },
                {
                src: "./src/Assets/TILES_White_M.png",
                width: 100,
                height: 100,
                },
                {
                src: "./src/Assets/TILES_White_O.png",
                width: 100,
                height: 100,
                },
                {
                src: "./src/Assets/TILES_White_S.png",
                width: 100,
                height: 100,
                },
            ],
        },
        // Sets the size of the confetti. 
        scalar: 5,
        zIndex: 100,
        disableForReducedMotion: true,
    });    
}

// Prints a series of three pop-ups that explain the goal of the game and the controls. 
// These are all nested so one comes after the other.
function PrintHelpControls() {
    Swal.fire({
        title: "Welcome to MESO",
        html: "A mesostic is a poem where the lines contain an intersecting vertical phrase. <br /><br />The goal of the game is to first solve each word given the clues, then find the central theme word that links them all.",
        imageUrl: "./src/Assets/Meso_Logo.png",
        imageHeight: 200,
        imageWidth: 250,
        padding: "3em",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Next &rarr;"
    }).then(() => {
        Swal.fire({
            title: "Controls",
            html: "Use the keyboard to enter the word for each clue. <br />Correct words change color.",
            imageUrl: "./src/Assets/MESO_KeyboardControls.png",
            imageHeight: 220,
            imageWidth: 350,
            padding: "3em",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Next &rarr;",
        }).then(() => {
            Swal.fire({
                imageUrl: "./src/Assets/Linkr_UpDown.png",
                title: "Controls",
                padding: "3em",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Next &rarr;",
                text: "Use the Up and Down arrow keys or the mouse to to move between words.",
            }).then(() => {
                Swal.fire({
                    imageUrl: "./src/Assets/Linkr_LeftToRight.png",
                    title: "Controls",
                    padding: "3em",
                    confirmButtonColor: "3085d6",
                    confirmButtonText: "Next &rarr;",
                    text: "Use the Left and Right arrow keys or click and drag to slide the current word left and right.",
                }).then(() => {
                    Swal.fire({
                        title: "Winning the Game",
                        html: "If you get stuck the Hint button will give you the correct letter for your current box.<br /><br /> Remember - The vertical MESO is related to all the words in the game. Use the words as clues to unscramble and solve the MESO!",
                        imageUrl: "./src/Assets/Meso_Logo.png",
                        imageHeight: 200,
                        imageWidth: 250,
                        padding: "3em",
                        confirmButtonColor: "Green",
                        confirmButtonText: "Back to Game",
                    });
                });
            });
        });
    });
}

// This function gives the player the current letter when they click it.
function GiveHint(){
    // Checking that the active row isn't already complete. If it is we do nothing.
    if(CorrectRow[CurrRow] != 1){
        // Gets and stores the correct word for the current row
        // The [0] at the end here returns the first value in the key:value pair (i.e. the word:clue pair)
        let CurrCorrectWord = Word_List[(Object.keys(Word_List)[CurrRow])][0];
        // Loops through the current row to figure out which cells are active and how many are there.
        // Need a counter here which is used to track how many word boxes were present before the active cell. This corresponds to the letter in the word to be given minus 1 and is used to get the position in the string.
        let CharCounter = 0;
        let ActiveChar = 0;
        for (let j = 0; j < boxtype.grid[CurrRow].length; j++) {        
            if(boxtype.grid[CurrRow][j] == "word" || boxtype.grid[CurrRow][j] == "middle"){
                CharCounter++;
            }
            else if(boxtype.grid[CurrRow][j] == "active"){
                // We don't add one here since otherwise we'd have to substract one in the next step.
                ActiveChar = CharCounter; 
            }
        }
        addLetter(CurrCorrectWord[ActiveChar]);
        // Marking that a hint has been used and incrementing by one to track total hints for the puzzle.
        HintsUsed++;
        // Then we check if the person has correctly solved all the clue puzzles and the central theme word
        isWinner(); 
        // After capturing the keystroke and making the requisite changes, we update the grid which resets the colouring and text contents.
        updateGrid(); 
    }
}

// Function to welcome the player for the first time, direct them to the help menu, and ask them if they'd like to disable the welcome menu with a cookie.
function FirstTime(){
    // Checking if there's a cookie asking for the welcome message to be disabled. 
    // If not displaying the welcome message.
    if (CookieState["MesoWelcomeDisabled"] == "true"){
        document.cookie = `MesoWelcomeDisabled=true; ${CookieExpirationDate}; path=/`;
        return;
    }
    // If a cookie is not detected, show the welcome pop-up and ask if the user wants to disable future welcome popups.
    else{
        Swal.fire({
            title: "Welcome to MESO",
            html: "Gameplay instructions are available by clicking on the Controls button in the in the top right corner.<br /><br />If you're stuck the Hint button in the top left corner will give you the current letter of the box you're on. <br /><br />Would you like to disable this popup in the future?",
            imageUrl: "./src/Assets/Meso_Logo.png",
            imageHeight: 200,
            imageWidth: 250,
            padding: "3em",
            showCancelButton: true,
            confirmButtonColor: "#3A8F30",
            confirmButtonText: "Yes,Disable",
            cancelButtonText: "No, keep it for now!",
            cancelButtonColor: "#C73838",
          }).then((result) => {
            // If they would like to disable future popups we set a cookie to remember this choice.
            if (result.isConfirmed) {
                document.cookie = `MesoWelcomeDisabled=true; ${CookieExpirationDate}; path=/`;
            }
          });
    }
}
// Function checks if cookies are already present on the users computer, and if not then sets the placeholders
function GetCookies(){
    // If there are no cookies, set the first time cookies.
    // Added the expiration date here. Note this doesn't actually work - they just expire ~1 year from now. Wondering if there's a hardcoded upper limit on cookie age. 
    if (document.cookie == ""){
        // Change these to perpetually expire in 1 year.
        document.cookie = `MesoWelcomeDisabled=false; ${CookieExpirationDate}; path=/`;
        document.cookie = `FirstTimeHint=true; ${CookieExpirationDate}; path=/`;
        document.cookie = `PreviousWord=A; ${CookieExpirationDate}; path=/`;
        document.cookie = `Streak=0; ${CookieExpirationDate}; path=/`;
        document.cookie = `PerfectStreak=0; ${CookieExpirationDate}; path=/`;
    }
    
    // Getting the cookie string
    let cookieString = document.cookie.split('; ');

    // Lopping through all obtained cookies to seed the object with key value pairs.
    for (let c = 0; c < cookieString.length; c++){
        let LongCookie = cookieString[c].split(';');
        let ThisCookie = LongCookie[0].split('=');
        let KEY = ThisCookie[0];
        let VALUE = ThisCookie[1];
        CookieState[KEY] = VALUE;
    }
}


// called here so that it runs on startup (i.e. not nested in something.)
startup();

// Running things that need to happen after evertything is made. i.e. After the startup.
// Adding an event listener for the help button. 
// This can technically be before startup since the help button is drawn in the html, but adding here for consistencies sake.

// This listens for a click on the "?" in the main page and then prings the help controls
// No idea why thefunction isn't refered to with the () here (i.e. PrintHelpControls()), but if you include them it prints right when the game starts.
document.addEventListener('DOMContentLoaded', function () {
    var HelpPressed = document.getElementById('HelpButton');
    var HintPressed = document.getElementById('HintButton');
    if (HelpPressed) {
        HelpPressed.addEventListener('click', PrintHelpControls);
    }
    if (HintPressed) {
        HintPressed.addEventListener('click', GiveHint);
    }
});

// Adding Event Listeners for the boxes
const BoxList = document.getElementsByClassName('box');
// Loops through the BoxList and adds the event listers and responses to them.
for (var i = 0; i < BoxList.length; i++){
    BoxList[i].addEventListener("click", BoxClicked);
    BoxList[i].addEventListener("mousedown", BoxDragged);
    BoxList[i].addEventListener("touchstart", BoxDraggedMobile);
}

// Function that makes the clicked box the active box. 
function BoxClicked(){
    // The below first if statment is depreciated. It doesn't work with the BoxDragged function, since that initiates on mouse down and a click requires a mouse down followed by mouse up.
    // Since the BoxDragged function sets the mousedown cell to be active, it can never be any of these.
    // As such the only thing it can ever click is an active or not active cell. 
    // So removing this for a simplified IF statment that includes only those two options. 
    // if (this.classList.contains("right") || this.classList.contains("wrong") || this.classList.contains("right-correct") || this.classList.contains("wrong-correct") ){

    //     // Opens the keyboard on mobile.
    //     HiddenInput.focus();

    //     // Put a function here since when we click and drag we also want to set the OG box as active so the right row is dragged.
    //     SetActiveCell(this.id);
    // }

    // Checks if the clicked box is active and opens the keyboard. 
    // Adding the second line here which does nothing, but it wasn't working originally, so testing if having this in here helps. 
    if (this.classList.contains("active") || this.classList.contains("active-correct")){
        showKeyboard();
        boxtype.grid[CurrRow][CurrCol] = "active";
    }
    // Checks if a box that is empty/hidden is clicked and hides the keyboard
    else {
        hideKeyboard();
    }
    updateGrid(); 
}

// Function which kicks in when a box is being dragged.
function BoxDragged(event){

    // Stores the original start X position (don't need Y since you can't drag in the vertical direction).
    let StartX = event.clientX;

    // Checking if this is a cell that can be marked active for the box drag event. 
    if (this.classList.contains("right") || this.classList.contains("wrong") || this.classList.contains("right-correct") || this.classList.contains("wrong-correct") ){
        // Using this function here again so that if the user wants to drag another row that one will become active. 
        SetActiveCell(this.id);
    }


    // Function which kicks in repeatedly while the box is being actively being dragged.
    // This checks the current X and Y positions and compares them to the original X and Y positions to see if the boxes should be shifted or not.
    const MouseMovingFunction = (e) => {
        // Stores the current X and Y cords
        let CurrX = e.clientX;

        // Checks if we've move at least half a box and if the numbers are increasing (moving right) or decreasing (moving left)
        if (Math.abs(CurrX - StartX)>(this.offsetWidth/2) && (CurrX - StartX) > 0 && AlreadyWonFlag == false){
            MoveRight();
            StartX = CurrX;

        }
        else if (Math.abs(CurrX - StartX)>(this.offsetWidth/2) && (CurrX - StartX) < 0 && AlreadyWonFlag == false){
            MoveLeft();
            StartX = CurrX;
        }
        // Checks after to see if the person won and to update the grid.
        isWinner(); 
        updateGrid();
      };
    
    // Function which triggers when the user let's go of the mouse button. 
    // It only removes the event listers that control when the mouse is moving (MouseMovingFunction) and the function for when the mouse button is let go (MouseMovingFunction)
    const MouseUpFunction = () => {
        document.removeEventListener('mousemove', MouseMovingFunction);
        document.removeEventListener('mouseup', MouseUpFunction);
    };

    // Adds two event listeners that need to follow this event - mouse movement, and mouse up.
    document.addEventListener('mousemove', MouseMovingFunction);
    document.addEventListener('mouseup', MouseUpFunction);
}

// Probably don't need an entirely seperate function here and could have combined with the above, but keeping this here for legibility and troubleshooting. 
function BoxDraggedMobile(event){

    // Touch events store data differently and you need to denote the touch you're interested in
    // This is done by calling the touches array for the event (touches[0] gets the first touch), then getting the X coord.
    // Stores the original start X position (don't need Y since you can't drag in the vertical direction).
    let StartX = event.touches[0].clientX;

    // Checking if this is a cell that can be marked active for the box drag event. 
    if (this.classList.contains("right") || this.classList.contains("wrong") || this.classList.contains("right-correct") || this.classList.contains("wrong-correct") ){
        // Using this function here again so that if the user wants to drag another row that one will become active. 
        SetActiveCell(this.id);
    }

    // Function which kicks in repeatedly while the box is being actively being dragged.
    // This checks the current X and Y positions and compares them to the original X and Y positions to see if the boxes should be shifted or not.
    const TouchMovingFunction = (e) => {

        // Stores the current X and Y cords
        // This is again different for touch events which store touch movement in an subarray called changedTouches (changedTouches[0] is the first of these.)
        let CurrX = e.changedTouches[0].clientX;

        // Checks if we've move at least half a box and if the numbers are increasing (moving right) or decreasing (moving left)
        if (Math.abs(CurrX - StartX)>(this.offsetWidth/2) && (CurrX - StartX) > 0 && AlreadyWonFlag == false){
            MoveRight();
            StartX = CurrX;

        }
        else if (Math.abs(CurrX - StartX)>(this.offsetWidth/2) && (CurrX - StartX) < 0 && AlreadyWonFlag == false){
            MoveLeft();
            StartX = CurrX;
        }
        // Checks after to see if the person won and to update the grid.
        isWinner(); 
        updateGrid();
      };
    
    // Function which triggers when the user let's go of the mouse button. 
    // It only removes the event listers that control when the mouse is moving (MouseMovingFunction) and the function for when the mouse button is let go (MouseMovingFunction)
    const TouchUpFunction = (e) => {
        document.removeEventListener('touchmove', TouchMovingFunction);
        document.removeEventListener('touchend', TouchUpFunction);
    };

    // Adds two event listeners that need to follow this event - mouse movement, and mouse up.
    document.addEventListener('touchmove', TouchMovingFunction);
    document.addEventListener('touchend', TouchUpFunction);
}


function SetActiveCell(ID){
    // Getting the position of the box clicked by parsing the ID string.
    // There's a max of 9 rows so I don't think the first vlaue should ever be more than 1 digit, wheras col can be multiple.
    let ClickRow = Number(ID.substring(3,4));
    let ClickCol = Number(ID.substring(4));

    // Reseting the Box state to reset box classes to default, then setting the clicked box to be active. 
    ResetBoxState(); 
    boxtype.grid[ClickRow][ClickCol] = "active";
    CurrCol = ClickCol;
    CurrRow = ClickRow;
    updateGrid();
}