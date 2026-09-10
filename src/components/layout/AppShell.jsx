import Header from './Header.jsx'
import TabBar from './TabBar.jsx'

export default function AppShell({ tabs, activeTab, onTabChange, headerActions, children }) {
  return (
    <div className="min-h-dvh">
      <Header actions={headerActions} />
      <TabBar tabs={tabs} activeId={activeTab} onChange={onTabChange} />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pb-10">{children}</main>
    </div>
  )
}
