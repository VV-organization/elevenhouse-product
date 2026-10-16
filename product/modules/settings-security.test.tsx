import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {TwoFactorSetup} from './settings-security'
describe('authenticator setup UI',()=>{
 it('shows an unavailable state without inventing a setup secret or an enabled status',()=>{
  const html=renderToStaticMarkup(<TwoFactorSetup onClose={()=>{}}/>);
  expect(html).toContain('Ключ подключения пока не получен');expect(html).not.toContain('Приложение подключено');expect(html).toContain('disabled');
 })
 it('shows the supplied key and verification field but never embeds an expired key',()=>{
  const challenge={id:'setup',secret:'qa-secret',expiresAt:'2099-01-01T00:00:00Z'};
  const html=renderToStaticMarkup(<TwoFactorSetup data={{challenge}} onClose={()=>{}}/>);
  expect(html).toContain('qa-secret');expect(html).toContain('one-time-code');expect(html).not.toContain('Приложение подключено');
  const expired=renderToStaticMarkup(<TwoFactorSetup data={{challenge:{...challenge,expiresAt:'2000-01-01T00:00:00Z'}}} onClose={()=>{}}/>);
  expect(expired).not.toContain('qa-secret');expect(expired).toContain('Время настройки истекло');
 })
})
