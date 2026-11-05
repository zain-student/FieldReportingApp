// /**
//  * @format
//  */

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';

// AppRegistry.registerComponent(appName, () => App);

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { syncPendingReports } from './src/features/reports/syncManager';

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask('FieldReportSync', () => async () => {
  await syncPendingReports();
});
