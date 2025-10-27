// Comments screen for displaying and adding comments
import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import CommentsList from '../components/CommentsList';

type CommentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Comments'>;
type CommentsScreenRouteProp = RouteProp<RootStackParamList, 'Comments'>;

const CommentsScreen: React.FC = () => {
  const navigation = useNavigation<CommentsScreenNavigationProp>();
  const route = useRoute<CommentsScreenRouteProp>();
  const { updateId } = route.params;

  return (
    <CommentsList 
      updateId={updateId} 
      onClose={() => navigation.goBack()} 
    />
  );
};

export default CommentsScreen;
