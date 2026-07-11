import os
import re
import json

STATE_FILE = "game_state.json"
README_FILE = "README.md"
RESET_LINK = "https://github.com/hiron1999/hiron1999/issues/new?title=ttplay%7Creset&body=Click+%22Submit+new+issue%22+to+reset+the+board%21"

def init_game():
    return {
        "board": [" "] * 9,
        "winner": None,  # "X", "O", "draw", None
        "status": "🎮 Your turn! Click any empty grid cell below to start."
    }

def check_winner(board):
    win_coords = [
        (0,1,2), (3,4,5), (6,7,8), # rows
        (0,3,6), (1,4,7), (2,5,8), # cols
        (0,4,8), (2,4,6)           # diagonals
    ]
    for c1, c2, c3 in win_coords:
        if board[c1] != " " and board[c1] == board[c2] == board[c3]:
            return board[c1]
    if " " not in board:
        return "draw"
    return None

def cpu_move(board):
    # Smart CPU logic (plays "O")
    # 1. Can CPU win in this move?
    for i in range(9):
        if board[i] == " ":
            board[i] = "O"
            if check_winner(board) == "O":
                return i
            board[i] = " "  # backtrack

    # 2. Can player X win in this move? If so, block them.
    for i in range(9):
        if board[i] == " ":
            board[i] = "X"
            if check_winner(board) == "X":
                board[i] = "O"
                return i
            board[i] = " "  # backtrack

    # 3. Take center if available
    if board[4] == " ":
        board[4] = "O"
        return 4

    # 4. Take corners if available
    corners = [0, 2, 6, 8]
    for c in corners:
        if board[c] == " ":
            board[c] = "O"
            return c

    # 5. Take any remaining slot
    for i in range(9):
        if board[i] == " ":
            board[i] = "O"
            return i
            
    return -1

def render_board(board, winner):
    html = []
    html.append('  <table align="center" style="border-collapse: collapse; border: none; border-spacing: 4px;">')
    for row in range(3):
        html.append('    <tr>')
        for col in range(3):
            idx = row * 3 + col
            cell = board[idx]
            html.append('      <td style="padding: 4px; border: none; background: transparent;">')
            if cell == "X":
                html.append('        <img src="assets/x.svg" width="70" height="70" alt="X" />')
            elif cell == "O":
                html.append('        <img src="assets/o.svg" width="70" height="70" alt="O" />')
            else: # " "
                if winner is None:
                    link = f"https://github.com/hiron1999/hiron1999/issues/new?title=ttplay%7C{row}%7C{col}&body=Just+click+%22Submit+new+issue%22+to+register+your+move.+The+GitHub+Action+will+update+the+board+in+seconds."
                    html.append(f'        <a href="{link}"><img src="assets/empty.svg" width="70" height="70" alt="Play" /></a>')
                else:
                    html.append('        <img src="assets/empty.svg" width="70" height="70" alt="Empty" />')
            html.append('      </td>')
        html.append('    </tr>')
    html.append('  </table>')
    return "\n".join(html)

def main():
    title = os.environ.get("ISSUE_TITLE", "").strip()
    print(f"Processing issue title: '{title}'")
    
    # Load state
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
        except Exception:
            state = init_game()
    else:
        state = init_game()

    # Parse command
    if title == "ttplay|reset":
        state = init_game()
        print("Game reset.")
    else:
        match = re.match(r"^ttplay\|([0-2])\|([0-2])$", title)
        if match:
            row, col = int(match.group(1)), int(match.group(2))
            idx = row * 3 + col
            
            board = state["board"]
            winner = state["winner"]
            
            if winner is not None:
                state["status"] = f"⚠️ Game already ended! Winner: {winner.upper()}. Click RESET GAME below to play again."
            elif board[idx] != " ":
                state["status"] = "⚠️ Cell is already occupied! Click an empty grid square."
            else:
                # User's Move
                board[idx] = "X"
                winner = check_winner(board)
                
                if winner:
                    state["winner"] = winner
                    if winner == "draw":
                        state["status"] = "🤝 Game Over! It's a draw!"
                    else:
                        state["status"] = "🎉 Game Over! You won! 🏆"
                else:
                    # CPU's Move
                    cpu_idx = cpu_move(board)
                    if cpu_idx != -1:
                        winner = check_winner(board)
                        if winner:
                            state["winner"] = winner
                            if winner == "draw":
                                state["status"] = "🤝 Game Over! It's a draw!"
                            else:
                                state["status"] = "💀 Game Over! CPU won! 👾"
                        else:
                            state["status"] = "🤖 CPU placed O. Your turn!"
                    else:
                        state["winner"] = "draw"
                        state["status"] = "🤝 Game Over! It's a draw!"
        else:
            print("Invalid move command structure.")
            return

    # Save state
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    # Render board
    board_html = render_board(state["board"], state["winner"])

    # Update README
    with open(README_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    block = f"""<!-- TIC-TAC-TOE-START -->
<p align="center">
  <b>{state["status"]}</b>
</p>

{board_html}

<p align="center">
  <a href="{RESET_LINK}"><img src="https://img.shields.io/badge/RESET_GAME-ff00ff?style=for-the-badge&logo=github&logoColor=ffffff" alt="Reset Game" /></a>
</p>
<!-- TIC-TAC-TOE-END -->"""

    pattern = r"<!-- TIC-TAC-TOE-START -->.*?<!-- TIC-TAC-TOE-END -->"
    new_content = re.sub(pattern, block, content, flags=re.DOTALL)
    
    with open(README_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print("README.md and game state updated successfully.")

if __name__ == "__main__":
    main()
