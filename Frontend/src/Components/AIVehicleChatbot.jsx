// components/AIVehicleChatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  IconButton, 
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@material-ui/core';
import { 
  Send as SendIcon,
  Person as UserIcon 
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import ChatIcon from '@material-ui/icons/Chat';
import AndroidIcon from '@material-ui/icons/Android'; // Robot icon

const useStyles = makeStyles((theme) => ({
  chatContainer: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    width: 350,
    maxHeight: 500,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    boxShadow: theme.shadows[5],
    borderRadius: 12,
    overflow: 'hidden'
  },
  chatHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center'
  },
  chatBody: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    height: 400
  },
  chatFooter: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    alignItems: 'center'
  },
  messageInput: {
    flexGrow: 1,
    marginRight: theme.spacing(1)
  },
  botMessage: {
    backgroundColor: theme.palette.grey[100],
    borderRadius: '18px 18px 18px 4px',
    padding: theme.spacing(1, 2),
    margin: theme.spacing(1, 0),
    maxWidth: '80%',
    alignSelf: 'flex-start'
  },
  userMessage: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    borderRadius: '18px 18px 4px 18px',
    padding: theme.spacing(1, 2),
    margin: theme.spacing(1, 0),
    maxWidth: '80%',
    alignSelf: 'flex-end'
  },
  toggleButton: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 1000
  }
}));

const AIVehicleChatbot = ({ vehicleDetails }) => {
  const classes = useStyles();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial greeting from the bot
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          text: `Hello! I'm your vehicle customization assistant. I can suggest modern colors, parts, and upgrades for your ${vehicleDetails?.make || 'vehicle'} ${vehicleDetails?.model || ''}. What would you like to enhance?`,
          sender: 'bot'
        }
      ]);
    }
  }, [isOpen, vehicleDetails]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Call your backend API which interacts with OpenAI
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: input,
          vehicleDetails: {
            make: vehicleDetails?.make,
            model: vehicleDetails?.model,
            year: vehicleDetails?.year,
            color: vehicleDetails?.color
          }
        })
      });

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
      }
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting to the AI service. Please try again later.", 
        sender: 'bot' 
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {!isOpen ? (
        <Button
          variant="contained"
          color="primary"
          className={classes.toggleButton}
          startIcon={<AndroidIcon  />}
          onClick={() => setIsOpen(true)}
        >
          Customization Assistant
        </Button>
      ) : (
        <Paper className={classes.chatContainer}>
          <Box className={classes.chatHeader}>
            <AndroidIcon  style={{ marginRight: 8 }} />
            <Typography variant="h6">Vehicle Customization Assistant</Typography>
            <Box flexGrow={1} />
            <IconButton 
              size="small" 
              onClick={() => setIsOpen(false)}
              style={{ color: 'white' }}
            >
              ×
            </IconButton>
          </Box>

          <Box className={classes.chatBody}>
            <List>
              {messages.map((msg, index) => (
                <React.Fragment key={index}>
                  <ListItem 
                    alignItems="flex-start"
                    style={{ 
                      flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                      padding: '4px 0'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar style={{ 
                        backgroundColor: msg.sender === 'user' ? '#3f51b5' : '#757575',
                        width: 32, 
                        height: 32 
                      }}>
                        {msg.sender === 'user' ? <UserIcon /> : <AndroidIcon  />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Paper 
                          elevation={0}
                          className={msg.sender === 'user' ? classes.userMessage : classes.botMessage}
                        >
                          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                            {msg.text}
                          </Typography>
                        </Paper>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          <Box className={classes.chatFooter}>
            <TextField
              className={classes.messageInput}
              placeholder="Ask about customization options..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              fullWidth
            />
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!input.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default AIVehicleChatbot;