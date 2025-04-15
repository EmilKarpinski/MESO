// Tutorial from here: https://www.youtube.com/watch?v=oKM2nQdQkIU

// Importing some packages to make this whole thing pretty
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11.16.0/+esm';

// Importing the puzzle parameters
import { Puzzle_Word_List, Puzzle_ThemeWord, Puzzle_Author } from './Puzzle.js';

// Setting variables to the imported puzzle parameters
// The Word list which contains the crossword words and puzzles
// The ThemeWord which contains the central word the individual words are related to.
const Word_List = Puzzle_Word_List;
const ThemeWord = Puzzle_ThemeWord;
const Author = Puzzle_Author; 

// Writing the puzzle author to the page.
document.getElementById('Author').innerHTML="Puzzle By: " + Author;

// QoL variables
// AlreadyWonFlag is a boolean that stores if someone has already won. If they have it stops reading keyboard commands and stops the popup from appearing. 
let AlreadyWonFlag = false; 

// Declaring an empty object to store to store cookies.
const CookieState = {};

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
        document.cookie = "FirstTimeHint=false";
        CookieState["FirstTimeHint"]  = "false";
    }

    // Checking to see if the central word is correct
    // Wrapping this in a timeout function set to 0.1s otherwise it prints the alert before the screen updates and freezes the update.
    setTimeout(() => {
        // Using the already won flag here 
        if (CentralWord == ThemeWord && AlreadyWonFlag == false){
            // Should set a flag to stop keyboard events alerts popping up after.
            AlreadyWonFlag = true;
            // alert("Congratulation! You Win!");
            WinDisplay();

        }
    },100);
}
function WinDisplay(){
    // Makes a fancier alert box using sweetalerts2
    Swal.fire({
        imageUrl: "./src/Assets/WinnerCrown.png",
        padding: "3em",
        text: 'Congratulations on completing today\'s puzzle. \n New puzzles every weekday by 10am EST!',
        confirmButtonText: 'Thanks For Playing',
        backdrop: 'rgba(212, 233, 214, 0.4)'
      })
    // Would like to eventually also add some animation here (like the fireworks library)
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
            html: "Use your keyboard to enter the word for each clue. <br />Correct words change color.",
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
                text: "Use the Up and Down arrow keys to move between words.",
            }).then(() => {
                Swal.fire({
                    imageUrl: "./src/Assets/Linkr_LeftToRight.png",
                    title: "Controls",
                    padding: "3em",
                    confirmButtonColor: "Green",
                    confirmButtonText: "Back to Game",
                    text: "Use the Left and Right arrow keys to slide the current word left and right.",
                });
            });
        });
    });
}
// Function to welcome the player for the first time, direct them to the help menu, and ask them if they'd like to disable the welcome menu with a cookie.
function FirstTime(){
    // Checking if there's a cookie asking for the welcome message to be disabled. 
    // If not displaying the welcome message.
    if (CookieState["MesoWelcomeDisabled"] == "true"){
        return;
    }
    // If a cookie is not detected, show the welcome pop-up and ask if the user wants to disable future welcome popups.
    else{
        Swal.fire({
            title: "Welcome to MESO",
            html: "Gameplay instructions are available by clicking on the question mark (?) in the top right corner.<br /><br />Would you like to disable this popup in the future?<br /><br /><i>Note: MESO currently does not work on mobile.</i>",
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
                document.cookie = "MesoWelcomeDisabled=true;";
            }
          });
    }
}
// Function checks if cookies are already present on the users computer, and if not then sets the placeholders
function GetCookies(){
    console.log(document.cookie);
    if (document.cookie != ""){
        // Getting the cookie string
        let cookieString = document.cookie.split('; ');

        // Lopping through all obtained cookies to seed the object with key value pairs.
        for (let c = 0; c < cookieString.length; c++){
            let ThisCookie = cookieString[c].split('=');
            let KEY = ThisCookie[0];
            let VALUE = ThisCookie[1];
            CookieState[KEY] = VALUE;
        }
    }
    // Else if there are no cookies, setting the two required cookies.
    else {
        document.cookie = "MesoWelcomeDisabled=false;"
        document.cookie = "FirstTimeHint=true;"
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
    if (HelpPressed) {
        HelpPressed.addEventListener('click', PrintHelpControls);
    }
    // Adding an input element off screen as well to catch input on mobile.
    const HiddenInput = document.createElement('HiddenInput');
    HiddenInput.focus();
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
    if (this.classList.contains("right") || this.classList.contains("wrong") || this.classList.contains("right-correct") || this.classList.contains("wrong-correct") ){

        // Opens the keyboard on mobile.
        HiddenInput.focus();

        // Put a function here since when we click and drag we also want to set the OG box as active so the right row is dragged.
        SetActiveCell(this.id);
    }
    // Checks if the clicked box is active and opens the keyboard
    // Adding the second line here which does nothing, but it wasn't working originally, so testing if having this in here helps. 
    else if (this.classList.contains("active")){
        HiddenInput.focus();
        boxtype.grid[CurrRow][CurrCol] = "active";
    }
    // Checks if a box that is empty/hidden is clicked and hides the keyboard
    else if (this.classList.contains("empty")){
        HiddenInput.blur();
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
        if (Math.abs(CurrX - StartX)>(this.offsetWidth/2) && (CurrX - StartX) > 0){
            console.log("MoveRight");
            MoveRight();
            StartX = CurrX;

        }
        else if (Math.abs(CurrX - StartX)>(this.offsetWidth/2) && (CurrX - StartX) < 0){
            console.log("MoveLeft");
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

function BoxDraggedMobile(event){

    // Stores the original start X position (don't need Y since you can't drag in the vertical direction).
    let StartX = event.clientX;

    // Using this function here again so that if the user wants to drag another row that one will become active. 
    SetActiveCell(this.id);

    // Function which kicks in repeatedly while the box is being actively being dragged.
    // This checks the current X and Y positions and compares them to the original X and Y positions to see if the boxes should be shifted or not.
    const TouchMovingFunction = (e) => {
        // Stores the current X and Y cords
        let CurrX = e.clientX;

        // Checks if we've move at least half a box and if the numbers are increasing (moving right) or decreasing (moving left)
        if (Math.abs(CurrX - StartX)>(this.offsetWidth/2) && (CurrX - StartX) > 0){
            console.log("MoveRight");
            MoveRight();
            StartX = CurrX;

        }
        else if (Math.abs(CurrX - StartX)>(this.offsetWidth/2) && (CurrX - StartX) < 0){
            console.log("MoveLeft");
            MoveLeft();
            StartX = CurrX;
        }
        // Checks after to see if the person won and to update the grid.
        isWinner(); 
        updateGrid();
      };
    
    // Function which triggers when the user let's go of the mouse button. 
    // It only removes the event listers that control when the mouse is moving (MouseMovingFunction) and the function for when the mouse button is let go (MouseMovingFunction)
    const TouchUpFunction = () => {
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