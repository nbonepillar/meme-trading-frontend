import { gql } from '@apollo/client';

export const GET_INITIAL_TOKENS = gql`
  query GetInitialTokens($input: TokenListInput) {
    tokens(input: $input) {
      c
      a
      s
      n
      i
      ts
      d
      ct
      m
      sa
      v
      bs
      l
      h
      t
      st
      bt
      mc
      p
      p24
      p7
      v24
      l24
      h24
      cat
    }
  }
`;
