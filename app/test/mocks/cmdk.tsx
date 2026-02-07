import * as React from 'react';

type CommandComponent = React.FC<React.HTMLAttributes<HTMLDivElement>> & {
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  List: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  Empty: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  Group: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  Separator: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  Item: React.FC<React.HTMLAttributes<HTMLDivElement>>;
};

const CommandBase: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

const Command = CommandBase as CommandComponent;

Command.Input = (props) => <input {...props} />;
Command.List = ({ children, ...props }) => <div {...props}>{children}</div>;
Command.Empty = ({ children, ...props }) => <div {...props}>{children}</div>;
Command.Group = ({ children, ...props }) => <div {...props}>{children}</div>;
Command.Separator = (props) => <div {...props} />;
Command.Item = ({ children, ...props }) => <div {...props}>{children}</div>;

export { Command };
